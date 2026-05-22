import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { testPrisma } from './setup/testClient';
import { makeTestContext } from './setup/testContext';
import { resetDatabase } from './setup/truncate';
import { seedTestData } from './setup/seed';
import * as C from './setup/constants';
import { Queries } from '../../src/resolvers/queries';
import { AdminMutations } from '../../src/resolvers/mutations/admin';

beforeAll(async () => {
  await resetDatabase(testPrisma);
  await seedTestData(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});

describe('User management', () => {
  describe('queries', () => {
    it('lists users (admin)', async () => {
      const ctx = makeTestContext('admin');
      const users = await Queries.users(null, {}, ctx);
      expect(users.length).toBeGreaterThanOrEqual(3);
      const emails = users.map((u: { email: string }) => u.email);
      expect(emails).toContain('admin@test.com');
      expect(emails).toContain('editor@test.com');
      expect(emails).toContain('member@test.com');
    });

    it('rejects listing users without users.manage permission', async () => {
      const ctx = makeTestContext('member');
      await expect(
        Queries.users(null, {}, ctx)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('inviteUser', () => {
    it('invites a new user', async () => {
      const ctx = makeTestContext('admin');
      const result = await AdminMutations.inviteUser(null, {
        email: 'newuser@test.com',
        groupIds: [C.MEMBER_GROUP_ID],
      }, ctx);
      expect(result).toBe(true);

      // Verify user was created
      const user = await testPrisma.users.findUnique({ where: { email: 'newuser@test.com' } });
      expect(user).not.toBeNull();

      // Clean up
      await testPrisma.user_groups.deleteMany({ where: { user_id: user!.id } });
      await testPrisma.users.delete({ where: { id: user!.id } });
    });

    it('rejects duplicate email', async () => {
      const ctx = makeTestContext('admin');
      await expect(
        AdminMutations.inviteUser(null, { email: 'admin@test.com', groupIds: [] }, ctx)
      ).rejects.toThrow(/already exists/i);
    });

    it('validates email format', async () => {
      const ctx = makeTestContext('admin');
      await expect(
        AdminMutations.inviteUser(null, { email: 'not-an-email', groupIds: [] }, ctx)
      ).rejects.toThrow(/email/i);
    });

    it('rejects without users.manage permission', async () => {
      const ctx = makeTestContext('editor');
      await expect(
        AdminMutations.inviteUser(null, { email: 'someone@test.com', groupIds: [] }, ctx)
      ).rejects.toThrow('Access denied');
    });
  });

  describe('updateUserGroups', () => {
    it('updates user group memberships', async () => {
      const ctx = makeTestContext('admin');
      const result = await AdminMutations.updateUserGroups(null, {
        userId: C.MEMBER_USER_ID,
        groupIds: [C.EDITOR_GROUP_ID],
      }, ctx);
      expect(result.groups).toHaveLength(1);
      expect(result.groups[0].slug).toBe('editors');

      // Restore original membership
      await testPrisma.user_groups.deleteMany({ where: { user_id: C.MEMBER_USER_ID } });
      await testPrisma.user_groups.create({ data: { user_id: C.MEMBER_USER_ID, group_id: C.MEMBER_GROUP_ID } });
    });

    it('cannot remove the last admin from Administrators group', async () => {
      const ctx = makeTestContext('admin');
      // Admin user is the only administrator — removing them from Administrators should fail
      await expect(
        AdminMutations.updateUserGroups(null, {
          userId: C.ADMIN_USER_ID,
          groupIds: [C.MEMBER_GROUP_ID], // Move to Members, removing from Administrators
        }, ctx)
      ).rejects.toThrow(/last administrator/i);
    });
  });

  describe('removeUser', () => {
    it('removes a user', async () => {
      const ctx = makeTestContext('admin');

      // Create a throwaway user
      const user = await testPrisma.users.create({
        data: { email: 'removeme@test.com', password_hash: 'hash' },
      });

      const result = await AdminMutations.removeUser(null, { userId: user.id }, ctx);
      expect(result).toBe(true);

      const found = await testPrisma.users.findUnique({ where: { id: user.id } });
      expect(found).toBeNull();
    });

    it('cannot remove yourself', async () => {
      const ctx = makeTestContext('admin');
      await expect(
        AdminMutations.removeUser(null, { userId: C.ADMIN_USER_ID }, ctx)
      ).rejects.toThrow(/yourself/i);
    });

    it('cannot remove the last administrator', async () => {
      const ctx = makeTestContext('admin');
      // Create a second user who is the only admin besides our context user
      const soloAdmin = await testPrisma.users.create({
        data: { email: 'soloadmin@test.com', password_hash: 'hash' },
      });
      await testPrisma.user_groups.create({
        data: { user_id: soloAdmin.id, group_id: C.ADMIN_GROUP_ID },
      });

      // Now remove original admin from admin group so soloAdmin is the only one
      await testPrisma.user_groups.delete({
        where: { user_id_group_id: { user_id: C.ADMIN_USER_ID, group_id: C.ADMIN_GROUP_ID } },
      });

      // Try to remove the last admin
      await expect(
        AdminMutations.removeUser(null, { userId: soloAdmin.id }, ctx)
      ).rejects.toThrow(/last administrator/i);

      // Restore: put original admin back and clean up
      await testPrisma.user_groups.create({
        data: { user_id: C.ADMIN_USER_ID, group_id: C.ADMIN_GROUP_ID },
      });
      await testPrisma.user_groups.deleteMany({ where: { user_id: soloAdmin.id } });
      await testPrisma.users.delete({ where: { id: soloAdmin.id } });
    });

    it('rejects without users.manage permission', async () => {
      const ctx = makeTestContext('editor');
      await expect(
        AdminMutations.removeUser(null, { userId: C.MEMBER_USER_ID }, ctx)
      ).rejects.toThrow('Access denied');
    });
  });
});
