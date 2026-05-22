import { GraphQLContext } from '../../context';
import { requirePermission, validateRequired, validateEmail, validateMaxLength } from '../helpers';
import { hashPassword } from '../../services/auth';
import { LOG_LEVELS } from '../../logger';
import crypto from 'crypto';

export const AdminMutations = {
  // ── System ──────────────────────────────────────────────────────────────

  setSystemLogLevel: (_: unknown, { level }: { level: string }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'settings.manage');
    if (!LOG_LEVELS.includes(level as typeof LOG_LEVELS[number])) {
      throw new Error(`Invalid log level. Must be one of: ${LOG_LEVELS.join(', ')}`);
    }
    process.env.LOG_LEVEL = level;
    ctx.log.info({ level }, 'System log level changed');
    return true;
  },

  // ── Users ──────────────────────────────────────────────────────────────

  inviteUser: async (_: unknown, { email, groupIds }: { email: string; groupIds: string[] }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');
    validateRequired(email, 'Email');
    validateEmail(email);

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await ctx.prisma.users.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new Error('A user with this email already exists');

    // Create user with a temporary password (they'll reset via email)
    const tempPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await hashPassword(tempPassword);

    const user = await ctx.prisma.users.create({
      data: {
        email: normalizedEmail,
        password_hash: passwordHash,
        password_reset_token: crypto.randomBytes(32).toString('hex'),
        password_reset_expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    // Assign to groups
    for (const groupId of groupIds) {
      await ctx.prisma.user_groups.create({
        data: { user_id: user.id, group_id: groupId },
      });
    }

    // TODO: Send invitation email with reset link
    ctx.log.info({ userId: user.id, email: normalizedEmail }, 'Invited user');
    return true;
  },

  updateUserGroups: async (_: unknown, { userId, groupIds }: { userId: string; groupIds: string[] }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');

    // Prevent removing the last administrator from the Administrators group
    const adminGroup = await ctx.prisma.groups.findUnique({ where: { slug: 'administrators' } });
    if (adminGroup && !groupIds.includes(adminGroup.id)) {
      const isCurrentlyAdmin = await ctx.prisma.user_groups.findUnique({
        where: { user_id_group_id: { user_id: userId, group_id: adminGroup.id } },
      });
      if (isCurrentlyAdmin) {
        const adminCount = await ctx.prisma.user_groups.count({
          where: { group_id: adminGroup.id },
        });
        if (adminCount <= 1) throw new Error('Cannot remove the last administrator from the Administrators group');
      }
    }

    // Remove all existing group memberships
    await ctx.prisma.user_groups.deleteMany({ where: { user_id: userId } });

    // Add new memberships
    for (const groupId of groupIds) {
      await ctx.prisma.user_groups.create({
        data: { user_id: userId, group_id: groupId },
      });
    }

    ctx.log.info({ userId, groupIds }, 'Updated user groups');

    // Return updated user
    const user = await ctx.prisma.users.findUniqueOrThrow({
      where: { id: userId },
      include: { user_groups: { include: { groups: { include: { permissions: true, _count: { select: { members: true } } } } } } },
    });

    return {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      emailVerified: !!user.email_verified_at,
      groups: user.user_groups.map((ug: typeof user.user_groups[number]) => ({
        id: ug.groups.id,
        name: ug.groups.name,
        slug: ug.groups.slug,
        description: ug.groups.description,
        isSystem: ug.groups.is_system,
        permissions: ug.groups.permissions.map((p: { permission: string }) => p.permission),
        memberCount: ug.groups._count.members,
      })),
      createdAt: user.created_at.toISOString(),
    };
  },

  removeUser: async (_: unknown, { userId }: { userId: string }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');
    if (userId === ctx.userId) throw new Error('Cannot remove yourself');

    // Prevent removing the last administrator
    const adminGroup = await ctx.prisma.groups.findUnique({ where: { slug: 'administrators' } });
    if (adminGroup) {
      const isAdmin = await ctx.prisma.user_groups.findUnique({
        where: { user_id_group_id: { user_id: userId, group_id: adminGroup.id } },
      });
      if (isAdmin) {
        const adminCount = await ctx.prisma.user_groups.count({
          where: { group_id: adminGroup.id },
        });
        if (adminCount <= 1) throw new Error('Cannot remove the last administrator');
      }
    }

    await ctx.prisma.user_groups.deleteMany({ where: { user_id: userId } });
    await ctx.prisma.users.delete({ where: { id: userId } });

    ctx.log.info({ userId }, 'Removed user');
    return true;
  },

  // ── Groups ─────────────────────────────────────────────────────────────

  createGroup: async (_: unknown, { input }: { input: { name: string; description?: string; permissions: string[] } }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');
    validateRequired(input.name, 'Name');
    validateMaxLength(input.name, 200, 'Name');

    const slug = input.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const existing = await ctx.prisma.groups.findUnique({ where: { slug } });
    if (existing) throw new Error('A group with this name already exists');

    const group = await ctx.prisma.groups.create({
      data: {
        name: input.name,
        slug,
        description: input.description ?? null,
      },
    });

    if (input.permissions.length > 0) {
      await ctx.prisma.group_permissions.createMany({
        data: input.permissions.map((p: string) => ({ group_id: group.id, permission: p })),
      });
    }

    ctx.log.info({ groupId: group.id, name: input.name }, 'Created group');
    return {
      id: group.id,
      name: group.name,
      slug: group.slug,
      description: group.description,
      isSystem: group.is_system,
      permissions: input.permissions,
      memberCount: 0,
    };
  },

  updateGroup: async (_: unknown, { input }: { input: { id: string; name?: string; description?: string; permissions?: string[] } }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');

    const group = await ctx.prisma.groups.findUniqueOrThrow({ where: { id: input.id } });

    if (input.name !== undefined && !group.is_system) {
      validateRequired(input.name, 'Name');
      validateMaxLength(input.name!, 200, 'Name');
      await ctx.prisma.groups.update({ where: { id: input.id }, data: { name: input.name } });
    }

    if (input.description !== undefined) {
      await ctx.prisma.groups.update({ where: { id: input.id }, data: { description: input.description } });
    }

    if (input.permissions !== undefined) {
      await ctx.prisma.group_permissions.deleteMany({ where: { group_id: input.id } });
      if (input.permissions.length > 0) {
        await ctx.prisma.group_permissions.createMany({
          data: input.permissions.map((p: string) => ({ group_id: input.id, permission: p })),
        });
      }
    }

    const updated = await ctx.prisma.groups.findUniqueOrThrow({
      where: { id: input.id },
      include: { permissions: true, _count: { select: { members: true } } },
    });

    ctx.log.info({ groupId: input.id }, 'Updated group');
    return {
      id: updated.id,
      name: updated.name,
      slug: updated.slug,
      description: updated.description,
      isSystem: updated.is_system,
      permissions: updated.permissions.map((p: { permission: string }) => p.permission),
      memberCount: updated._count.members,
    };
  },

  deleteGroup: async (_: unknown, { id }: { id: string }, ctx: GraphQLContext) => {
    requirePermission(ctx, 'users.manage');

    const group = await ctx.prisma.groups.findUniqueOrThrow({ where: { id } });
    if (group.is_system) throw new Error('Cannot delete a system group');

    await ctx.prisma.groups.delete({ where: { id } });
    ctx.log.info({ groupId: id }, 'Deleted group');
    return true;
  },
};
