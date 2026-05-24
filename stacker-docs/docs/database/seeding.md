---
sidebar_position: 3
---

# Seeding

The seed script (`prisma/seed.ts`) populates the database with default groups, an admin user, and sample data. It runs automatically during `yarn dev` and is idempotent -- it skips data that already exists.

## What Gets Seeded

### 1. Permission Groups

Three system groups with their permissions (see [Permissions](../api/permissions)):

- **Administrators** -- all permissions
- **Editors** -- content management permissions
- **Members** -- read + review permissions

### 2. Admin User

Created from environment variables:

| Variable | Purpose |
|----------|---------|
| `SEED_ADMIN_EMAIL` | Admin email (prompted by `yarn init-env`) |
| `SEED_ADMIN_PASSWORD` | Admin password (auto-generated, bcrypt hashed at seed time) |
| `SEED_ADMIN_FIRST_NAME` | First name |
| `SEED_ADMIN_LAST_NAME` | Last name |

The admin user is added to the Administrators group. If the user already exists, their password and name are updated (useful after `yarn reset-password`).

### 3. Sample Data

If no books exist in the database:

- **5 authors** -- Tolkien, Orwell, Austen, Herbert, Lee
- **8 books** -- The Hobbit, Lord of the Rings, 1984, Animal Farm, Pride and Prejudice, Sense and Sensibility, Dune, To Kill a Mockingbird

## Commands

```bash
# Re-run seed (idempotent)
yarn prisma db seed

# Export current database to seed JSON file
yarn seed:export
```

## Exporting Seed Data

The `seed:export` script (`scripts/export-seed.ts`) reads the current database and writes authors, books, and reviews to `prisma/seed-data/sample-data.json`. This lets you:

1. Set up sample data through the UI
2. Run `yarn seed:export` to capture it
3. Commit the JSON file
4. Other developers get the same data via `yarn prisma db seed`

## How the Seed Script Works

```typescript
// 1. Seed default permission groups (skip if exists)
await seedDefaultGroups(prisma);

// 2. Seed admin user (create or update)
const hash = await bcrypt.hash(password, 12);
await prisma.users.upsert({ ... });

// 3. Seed sample data (skip if books exist)
const bookCount = await prisma.books.count();
if (bookCount > 0) return;
// ... create authors and books
```

The seed command is configured in `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node --project tsconfig.seed.json prisma/seed.ts"
  }
}
```
