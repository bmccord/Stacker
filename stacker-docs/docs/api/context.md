---
sidebar_position: 2
---

# GraphQL Context

Every GraphQL request gets a fresh context object created by the `createContext` function in `src/context/index.ts`. The context carries authentication state, permissions, the database client, and a logger.

## Context Interface

```typescript
interface GraphQLContext {
  prisma: PrismaClient;    // Database client (singleton)
  userId: string | null;   // Authenticated user ID, or null
  permissions: Set<string>; // Resolved permission strings
  log: Logger;             // Pino logger instance
}
```

## Authentication Resolution

The context factory checks three auth methods in order. The first one that succeeds wins:

### 1. Dev Bypass

If `DEV_ADMIN_USER_ID` is set in `.env`, that value becomes the `userId` and the user gets **all permissions** automatically. This bypasses JWT validation entirely — never set this in production.

### 2. API Key (CLI)

If the `X-Api-Key` header matches `STACKER_API_KEY`, the user is set to `cli-user` with all permissions. This is how the CLI authenticates without JWTs.

### 3. JWT (Web UI)

If the `Authorization: Bearer <token>` header is present, the token is verified using the `JWT_SECRET`. On success, the `sub` claim becomes the `userId`. On failure (expired, invalid), the request continues as unauthenticated.

## Permission Resolution

For real users (not dev bypass or CLI), permissions are loaded from the database:

1. Fetch the user's group memberships (`user_groups` table)
2. For each group, load its permissions (`group_permissions` table)
3. If the user is in the `administrators` group, they get **all** that group's permissions
4. Collect all permissions into a `Set<string>`

The permission set is checked by resolvers using `requirePermission(ctx, 'books.manage')`.

## Prisma Client

The Prisma client is a singleton created in `src/context/prisma.ts` using the MariaDB driver adapter. It reads `DATABASE_URL` from the environment. The same client instance is shared across all requests.

```typescript
const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
const prisma = new PrismaClient({ adapter });
```
