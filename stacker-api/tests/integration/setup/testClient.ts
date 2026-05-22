import { readFileSync, existsSync } from 'fs';
import { join } from 'path';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../../../src/generated/prisma/client';

// Read DATABASE_URL from .env.test (written by globalSetup) or fall back to defaults
function getDbUrl(): string {
  const envTestPath = join(__dirname, '.env.test');
  if (existsSync(envTestPath)) {
    const content = readFileSync(envTestPath, 'utf8');
    const match = content.match(/DATABASE_URL=(.+)/);
    if (match) return match[1].trim();
  }
  // Fallback for local dev
  const port = process.env.TEST_DB_PORT ?? '3307';
  return `mysql://root:testpass@127.0.0.1:${port}/stacker_test`;
}

const dbUrl = getDbUrl();
const adapter = new PrismaMariaDb(dbUrl);
export const testPrisma = new PrismaClient({ adapter });
