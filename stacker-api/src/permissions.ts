/**
 * Permission definitions and default group seeding.
 */

import type { PrismaClient } from './generated/prisma/client';

// All available permissions
export const ALL_PERMISSIONS = [
  // Books
  'books.view',
  'books.manage',
  // Authors
  'authors.view',
  'authors.manage',
  // Reviews
  'reviews.view',
  'reviews.manage',
  // Administration
  'users.manage',
  'settings.manage',
] as const;

export type Permission = typeof ALL_PERMISSIONS[number];

// Permission groups for the UI
export const PERMISSION_GROUPS = [
  {
    label: 'Content',
    permissions: [
      { id: 'books.view', label: 'View books' },
      { id: 'books.manage', label: 'Manage books' },
      { id: 'authors.view', label: 'View authors' },
      { id: 'authors.manage', label: 'Manage authors' },
      { id: 'reviews.view', label: 'View reviews' },
      { id: 'reviews.manage', label: 'Manage reviews' },
    ],
  },
  {
    label: 'Administration',
    permissions: [
      { id: 'users.manage', label: 'Manage users & groups' },
      { id: 'settings.manage', label: 'Manage settings' },
    ],
  },
];

// Default groups created on first seed
const DEFAULT_GROUPS = [
  {
    name: 'Administrators',
    slug: 'administrators',
    description: 'Full access to all features',
    isSystem: true,
    permissions: ALL_PERMISSIONS as unknown as string[],
    sortOrder: 0,
  },
  {
    name: 'Editors',
    slug: 'editors',
    description: 'Can manage books and authors',
    isSystem: true,
    permissions: ['books.view', 'books.manage', 'authors.view', 'authors.manage', 'reviews.view'],
    sortOrder: 1,
  },
  {
    name: 'Members',
    slug: 'members',
    description: 'Can browse and review books',
    isSystem: true,
    permissions: ['books.view', 'authors.view', 'reviews.view', 'reviews.manage'],
    sortOrder: 2,
  },
];

export async function seedDefaultGroups(prisma: PrismaClient) {
  for (const group of DEFAULT_GROUPS) {
    const existing = await prisma.groups.findUnique({ where: { slug: group.slug } });
    if (existing) continue;

    const created = await prisma.groups.create({
      data: {
        name: group.name,
        slug: group.slug,
        description: group.description,
        is_system: group.isSystem,
        sort_order: group.sortOrder,
      },
    });

    if (group.permissions.length > 0) {
      await prisma.group_permissions.createMany({
        data: group.permissions.map((p) => ({ group_id: created.id, permission: p })),
      });
    }
  }
}
