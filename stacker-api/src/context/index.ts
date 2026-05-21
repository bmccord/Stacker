/**
 * GraphQL context factory — resolves auth from request headers.
 */

import type { Request } from 'express';
import type { PrismaClient } from '../generated/prisma/client';
import { verifyToken } from '../services/auth';
import { logger } from '../logger';
import prisma from './prisma';

export interface GraphQLContext {
  prisma: PrismaClient;
  userId: string | null;
  permissions: Set<string>;
  log: typeof logger;
}

export async function createContext(req: Request): Promise<GraphQLContext> {
  const headers = req.headers;
  let userId: string | null = null;

  // Dev bypass
  if (process.env.DEV_ADMIN_USER_ID) {
    userId = process.env.DEV_ADMIN_USER_ID;
  }

  // API key auth (CLI)
  if (!userId) {
    const apiKey = headers['x-api-key'] as string | undefined;
    if (apiKey && apiKey === process.env.STACKER_API_KEY) {
      // CLI gets admin-level access
      userId = 'cli-user';
    }
  }

  // JWT auth
  if (!userId) {
    const authHeader = headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7);
        const payload = await verifyToken(token);
        userId = payload.sub;
      } catch {
        // Invalid token — continue as unauthenticated
      }
    }
  }

  // Load permissions
  let permissions = new Set<string>();
  if (userId && userId !== 'cli-user') {
    const memberships = await prisma.user_groups.findMany({
      where: { user_id: userId },
      include: { groups: { include: { permissions: true } } },
    });
    for (const m of memberships) {
      // Administrators get all permissions
      if (m.groups.slug === 'administrators') {
        const allPerms = await prisma.group_permissions.findMany({
          where: { group_id: m.group_id },
        });
        for (const p of allPerms) permissions.add(p.permission);
      } else {
        for (const p of m.groups.permissions) {
          permissions.add(p.permission);
        }
      }
    }
  } else if (userId === 'cli-user') {
    // CLI gets all permissions
    permissions = new Set(['books.view', 'books.manage', 'authors.view', 'authors.manage', 'reviews.view', 'reviews.manage', 'users.manage', 'settings.manage']);
  }

  return {
    prisma,
    userId,
    permissions,
    log: logger,
  };
}
