---
sidebar_position: 1
---

# API Overview

The API is a Node.js/TypeScript GraphQL server that serves as the single source of truth for all data and business logic. Both the UI and CLI are thin clients that communicate exclusively through GraphQL.

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Server | Express 4 |
| GraphQL | Apollo Server 4 |
| ORM | Prisma 7 with MariaDB driver adapter |
| Database | MariaDB 11 |
| Auth | Custom JWT (HS256 via jose), bcrypt (12 rounds) |
| Logging | Pino with pino-roll (rotating file logs) |
| Testing | Vitest (unit + integration) |

## Architecture

The API follows a layered architecture:

1. **Express** receives HTTP requests
2. **Apollo Server** parses GraphQL operations
3. **Context factory** resolves authentication and permissions per request
4. **Resolvers** execute business logic with authorization checks
5. **Prisma** handles database operations
6. **Mappers** transform database rows to GraphQL response shapes

## Key Design Decisions

### Schema-First GraphQL

The GraphQL schema is defined as SDL in `src/schema/typeDefs.ts`. Resolvers are organized by domain in `resolvers/queries/` and `resolvers/mutations/`.

### Upsert Pattern

Create and update operations share a single mutation using the upsert pattern. If `input.id` is provided, it's an update; otherwise, it's a create. This reduces schema surface area and simplifies the UI.

### Server-Side Validation

All mutations validate inputs server-side using helpers in `resolvers/helpers/`. Client validation improves UX but can be bypassed -- the server enforces its own rules. Available validators: `validateRequired`, `validateMaxLength`, `validateEmail`, `validateSlug`, `validateRange`, `validatePositiveInt`, `validateEnum`, `validateDomain`.

### Structured Logging

Pino logs to both console (pretty-printed in dev) and rotating log files (10MB per file, 14 files max). Logs are queryable via the `systemLogs` GraphQL query with filtering by level, search text, and date range. The system log level can be changed at runtime via the `setSystemLogLevel` mutation.

### Graceful Shutdown

The server handles `SIGTERM` and `SIGINT` signals, closing the HTTP server cleanly with a 3-second forced exit timeout. This ensures the port is freed when the process is killed.

### Periodic Cleanup

A background task runs on startup and every hour to clear expired password reset tokens and email verification tokens from the database.

### Safety Guards

- Cannot remove yourself as a user
- Cannot remove the last administrator
- Cannot reassign groups to leave zero administrators
- Cannot delete system groups (Administrators, Editors, Members)

## Entry Point

`src/index.ts` is the server entry point. It creates the Express app, starts Apollo Server, mounts the `/graphql` endpoint, registers the cleanup task, and sets up graceful shutdown handlers.
