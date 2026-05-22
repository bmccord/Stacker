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

describe('Groups CRUD', () => {
  it('lists groups', async () => {
    const ctx = makeTestContext('admin');
    const groups = await Queries.groups(null, {}, ctx);
    expect(groups.length).toBeGreaterThanOrEqual(3);
    const slugs = groups.map((g: { slug: string }) => g.slug);
    expect(slugs).toContain('administrators');
    expect(slugs).toContain('editors');
    expect(slugs).toContain('members');
  });

  it('gets a group by ID', async () => {
    const ctx = makeTestContext('admin');
    const group = await Queries.group(null, { id: C.EDITOR_GROUP_ID }, ctx);
    expect(group).not.toBeNull();
    expect(group!.name).toBe('Editors');
    expect(group!.permissions).toContain('books.manage');
  });

  it('creates a custom group', async () => {
    const ctx = makeTestContext('admin');
    const result = await AdminMutations.createGroup(null, {
      input: {
        name: 'Reviewers',
        description: 'Can manage reviews',
        permissions: ['reviews.view', 'reviews.manage'],
      },
    }, ctx);
    expect(result.name).toBe('Reviewers');
    expect(result.isSystem).toBe(false);
    expect(result.permissions).toContain('reviews.manage');

    // Clean up
    await testPrisma.group_permissions.deleteMany({ where: { group_id: result.id } });
    await testPrisma.groups.delete({ where: { id: result.id } });
  });

  it('updates a custom group', async () => {
    const ctx = makeTestContext('admin');
    const group = await AdminMutations.createGroup(null, {
      input: { name: 'Temp Group', permissions: [] },
    }, ctx);

    const updated = await AdminMutations.updateGroup(null, {
      input: {
        id: group.id,
        name: 'Updated Group',
        description: 'Updated description',
        permissions: ['books.view'],
      },
    }, ctx);
    expect(updated.name).toBe('Updated Group');
    expect(updated.permissions).toContain('books.view');

    // Clean up
    await testPrisma.group_permissions.deleteMany({ where: { group_id: group.id } });
    await testPrisma.groups.delete({ where: { id: group.id } });
  });

  it('deletes a custom group', async () => {
    const ctx = makeTestContext('admin');
    const group = await AdminMutations.createGroup(null, {
      input: { name: 'Delete Me', permissions: [] },
    }, ctx);

    const result = await AdminMutations.deleteGroup(null, { id: group.id }, ctx);
    expect(result).toBe(true);

    const found = await testPrisma.groups.findUnique({ where: { id: group.id } });
    expect(found).toBeNull();
  });

  it('cannot delete a system group', async () => {
    const ctx = makeTestContext('admin');
    await expect(
      AdminMutations.deleteGroup(null, { id: C.ADMIN_GROUP_ID }, ctx)
    ).rejects.toThrow(/system/i);
  });

  it('rejects group management without users.manage permission', async () => {
    const ctx = makeTestContext('editor');
    await expect(
      AdminMutations.createGroup(null, { input: { name: 'Nope', permissions: [] } }, ctx)
    ).rejects.toThrow('Access denied');
  });

  it('rejects group listing without users.manage permission', async () => {
    const ctx = makeTestContext('member');
    await expect(
      Queries.groups(null, {}, ctx)
    ).rejects.toThrow('Access denied');
  });
});
