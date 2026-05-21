import crypto from 'crypto';
import { GraphQLContext } from '../../context';
import { verifyPassword, hashPassword, generateToken } from '../../services/auth';
import { validateRequired, validateEmail } from '../helpers';
import { logger } from '../../logger';

export const AuthMutations = {
  signIn: async (_: unknown, { email, password }: { email: string; password: string }, ctx: GraphQLContext) => {
    validateRequired(email, 'Email');
    validateRequired(password, 'Password');
    validateEmail(email);

    const normalizedEmail = email.toLowerCase().trim();
    const user = await ctx.prisma.users.findUnique({ where: { email: normalizedEmail } });

    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password');
    }

    const valid = await verifyPassword(password, user.password_hash);
    if (!valid) throw new Error('Invalid email or password');

    const token = await generateToken(user.id);
    logger.info({ userId: user.id, email: normalizedEmail }, 'User signed in');

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: !!user.email_verified_at,
        createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
      },
    };
  },

  changePassword: async (_: unknown, { currentPassword, newPassword }: { currentPassword: string; newPassword: string }, ctx: GraphQLContext) => {
    if (!ctx.userId) throw new Error('Not authenticated');
    validateRequired(currentPassword, 'Current password');
    validateRequired(newPassword, 'New password');
    if (newPassword.length < 8) throw new Error('New password must be at least 8 characters');

    const user = await ctx.prisma.users.findUnique({ where: { id: ctx.userId } });
    if (!user || !user.password_hash) throw new Error('User not found');

    const valid = await verifyPassword(currentPassword, user.password_hash);
    if (!valid) throw new Error('Current password is incorrect');

    const hash = await hashPassword(newPassword);
    await ctx.prisma.users.update({ where: { id: ctx.userId }, data: { password_hash: hash } });

    logger.info({ userId: ctx.userId }, 'Password changed');
    return true;
  },

  requestPasswordReset: async (_: unknown, { email }: { email: string }, ctx: GraphQLContext) => {
    validateRequired(email, 'Email');
    validateEmail(email);

    const normalizedEmail = email.toLowerCase().trim();
    const user = await ctx.prisma.users.findUnique({ where: { email: normalizedEmail } });
    if (!user) return true; // Don't leak whether email exists

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await ctx.prisma.users.update({
      where: { id: user.id },
      data: { password_reset_token: token, password_reset_expires_at: expiresAt },
    });

    // TODO: Send password reset email
    logger.info({ userId: user.id, email: normalizedEmail }, 'Password reset requested');
    return true;
  },

  resetPassword: async (_: unknown, { token, password }: { token: string; password: string }, ctx: GraphQLContext) => {
    validateRequired(token, 'Token');
    validateRequired(password, 'Password');
    if (password.length < 8) throw new Error('Password must be at least 8 characters');

    const user = await ctx.prisma.users.findUnique({ where: { password_reset_token: token } });
    if (!user || !user.password_reset_expires_at) throw new Error('Invalid or expired reset link');
    if (new Date() > user.password_reset_expires_at) {
      await ctx.prisma.users.update({
        where: { id: user.id },
        data: { password_reset_token: null, password_reset_expires_at: null },
      });
      throw new Error('Invalid or expired reset link');
    }

    const hash = await hashPassword(password);
    await ctx.prisma.users.update({
      where: { id: user.id },
      data: {
        password_hash: hash,
        password_reset_token: null,
        password_reset_expires_at: null,
        email_verified_at: user.email_verified_at ?? new Date(),
      },
    });

    const jwt = await generateToken(user.id);
    logger.info({ userId: user.id }, 'Password reset completed');

    return {
      token: jwt,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        emailVerified: true,
        createdAt: user.created_at instanceof Date ? user.created_at.toISOString() : user.created_at,
      },
    };
  },
};
