import type { PrismaClient } from '../../../src/generated/prisma/client';

// Delete all data in dependency order (children first).
// Uses DELETE instead of TRUNCATE to work with the Prisma MariaDB adapter,
// which may not preserve session state (FOREIGN_KEY_CHECKS) across statements.
const TABLES = [
  'reviews',
  'books',
  'authors',
  'group_permissions',
  'user_groups',
  'groups',
  'users',
];

export async function resetDatabase(prisma: PrismaClient) {
  for (const table of TABLES) {
    await prisma.$executeRawUnsafe(`DELETE FROM \`${table}\``);
  }
}
