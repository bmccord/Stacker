---
sidebar_position: 2
---

# Migrations

Stacker uses Prisma Migrate for database schema management. Migrations are SQL files stored in `prisma/migrations/`.

## Commands

### Create a new migration (development)

```bash
cd stacker-api
yarn prisma migrate dev --name describe-your-change
```

This is interactive -- it compares the current schema against the database, generates a SQL migration file, and applies it immediately. Use descriptive names like `add-cover-url-to-books` or `create-reviews-table`.

### Apply existing migrations (CI/deployment)

```bash
yarn prisma migrate deploy
```

Non-interactive. Applies all pending migrations without creating new ones. This is what `yarn dev` runs on startup and what the Docker entrypoint uses in production.

### Regenerate Prisma client

After any schema change, regenerate the TypeScript client:

```bash
yarn prisma generate
```

This runs automatically during `yarn dev:setup`. If you modify `schema.prisma` while the server is running, you need to run this manually and restart the server (nodemon doesn't watch generated files).

## After Schema Changes

The full workflow after modifying `schema.prisma`:

```bash
# 1. Create and apply the migration
yarn prisma migrate dev --name your-change-name

# 2. Regenerate the client (included in step 1, but run separately if needed)
yarn prisma generate

# 3. Restart the dev server
# (nodemon will auto-restart if you change a src/ file, but not for generated files)
```

## Migration Lock

The `prisma/migrations/migration_lock.toml` file records the database provider (`mysql`). This prevents accidentally applying MySQL migrations to a PostgreSQL database or vice versa.

## Resetting the Database

For development, you can drop and recreate the database:

```bash
yarn prisma migrate reset
```

This drops the database, recreates it, applies all migrations, and runs the seed script. For remote environments, use the `reset-db.yml` GitHub Actions workflow.
