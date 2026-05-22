import pino from 'pino';
import { testPrisma } from './testClient';
import { ALL_PERMISSIONS } from '../../../src/permissions';
import type { GraphQLContext } from '../../../src/context';
import * as C from './constants';

const silentLogger = pino({ level: 'silent' });

type ContextPreset = 'admin' | 'editor' | 'member' | 'unauthenticated';

const EDITOR_PERMISSIONS = [
  'books.view', 'books.manage',
  'authors.view', 'authors.manage',
  'reviews.view',
];

const MEMBER_PERMISSIONS = [
  'books.view',
  'authors.view',
  'reviews.view', 'reviews.manage',
];

const PRESETS: Record<ContextPreset, Partial<GraphQLContext>> = {
  admin: {
    userId: C.ADMIN_USER_ID,
    permissions: new Set(ALL_PERMISSIONS as unknown as string[]),
  },
  editor: {
    userId: C.EDITOR_USER_ID,
    permissions: new Set(EDITOR_PERMISSIONS),
  },
  member: {
    userId: C.MEMBER_USER_ID,
    permissions: new Set(MEMBER_PERMISSIONS),
  },
  unauthenticated: {
    userId: null,
    permissions: new Set<string>(),
  },
};

export function makeTestContext(preset: ContextPreset, overrides?: Partial<GraphQLContext>): GraphQLContext {
  return {
    prisma: testPrisma,
    log: silentLogger,
    ...PRESETS[preset],
    ...overrides,
  } as GraphQLContext;
}
