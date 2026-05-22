import type { PrismaClient } from '../../../src/generated/prisma/client';
import * as C from './constants';

export async function seedTestData(prisma: PrismaClient) {
  // ── Users ────────────────────────────────────────────────────────────────

  // password_hash is a bcrypt hash of 'testpass'
  const testHash = '$2b$12$LJ3m4ys3Lz0Y.GM9BO/3guVb1sMsGm3ioRNW3FDvl3GNgBqEZmcE6';
  await prisma.users.createMany({
    data: [
      { id: C.ADMIN_USER_ID, email: 'admin@test.com', password_hash: testHash, first_name: 'Admin', last_name: 'User', email_verified_at: new Date() },
      { id: C.EDITOR_USER_ID, email: 'editor@test.com', password_hash: testHash, first_name: 'Editor', last_name: 'User', email_verified_at: new Date() },
      { id: C.MEMBER_USER_ID, email: 'member@test.com', password_hash: testHash, first_name: 'Member', last_name: 'User', email_verified_at: new Date() },
    ],
  });

  // ── Permission Groups ────────────────────────────────────────────────────

  await prisma.groups.createMany({
    data: [
      { id: C.ADMIN_GROUP_ID, name: 'Administrators', slug: 'administrators', description: 'Full access', is_system: true, sort_order: 0 },
      { id: C.EDITOR_GROUP_ID, name: 'Editors', slug: 'editors', description: 'Content management', is_system: true, sort_order: 1 },
      { id: C.MEMBER_GROUP_ID, name: 'Members', slug: 'members', description: 'Read and review', is_system: true, sort_order: 2 },
    ],
  });

  // Admin group gets all permissions
  await prisma.group_permissions.createMany({
    data: [
      'books.view', 'books.manage',
      'authors.view', 'authors.manage',
      'reviews.view', 'reviews.manage',
      'users.manage', 'settings.manage',
    ].map((perm) => ({ group_id: C.ADMIN_GROUP_ID, permission: perm })),
  });

  // Editor group gets content permissions
  await prisma.group_permissions.createMany({
    data: [
      'books.view', 'books.manage',
      'authors.view', 'authors.manage',
      'reviews.view',
    ].map((perm) => ({ group_id: C.EDITOR_GROUP_ID, permission: perm })),
  });

  // Member group gets read + review permissions
  await prisma.group_permissions.createMany({
    data: [
      'books.view', 'authors.view',
      'reviews.view', 'reviews.manage',
    ].map((perm) => ({ group_id: C.MEMBER_GROUP_ID, permission: perm })),
  });

  // Assign users to groups
  await prisma.user_groups.createMany({
    data: [
      { user_id: C.ADMIN_USER_ID, group_id: C.ADMIN_GROUP_ID },
      { user_id: C.EDITOR_USER_ID, group_id: C.EDITOR_GROUP_ID },
      { user_id: C.MEMBER_USER_ID, group_id: C.MEMBER_GROUP_ID },
    ],
  });

  // ── Authors ──────────────────────────────────────────────────────────────

  await prisma.authors.createMany({
    data: [
      { id: C.AUTHOR_TOLKIEN_ID, name: 'J.R.R. Tolkien', bio: 'English writer and philologist.' },
      { id: C.AUTHOR_ORWELL_ID, name: 'George Orwell', bio: 'English novelist and essayist.' },
    ],
  });

  // ── Books ────────────────────────────────────────────────────────────────

  await prisma.books.createMany({
    data: [
      { id: C.BOOK_HOBBIT_ID, title: 'The Hobbit', author_id: C.AUTHOR_TOLKIEN_ID, genre: 'Fantasy', description: 'A hobbit goes on an adventure.' },
      { id: C.BOOK_1984_ID, title: '1984', author_id: C.AUTHOR_ORWELL_ID, genre: 'Dystopian', description: 'A totalitarian society.' },
    ],
  });
}
