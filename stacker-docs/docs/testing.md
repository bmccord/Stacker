---
sidebar_position: 7
---

# Testing

Stacker uses Vitest for API testing (unit + integration) and Playwright for UI end-to-end tests.

## Quick Reference

```bash
cd stacker-api
yarn test                  # Run unit tests (fast, no Docker)
yarn test:watch            # Unit tests in watch mode
yarn test:integration      # Integration tests (requires Docker)
yarn test:integration:watch # Integration tests in watch mode

cd stacker-ui
yarn test:e2e              # E2E tests (headless)
yarn test:e2e:headed       # E2E with visible browser
yarn test:e2e:ui           # E2E with Playwright interactive UI
```

## Unit Tests

**Config:** `stacker-api/vitest.config.ts`
**Location:** Co-located with source files as `*.test.ts`

Unit tests cover pure functions with no external dependencies -- no database, no Docker.

### What's Tested

| File | Tests | Coverage |
|------|-------|---------|
| `validation.test.ts` | 56 | All input validators (required, maxLength, slug, positiveInt, nonNegativeInt, email, enum, range, domain) |
| `slugify.test.ts` | 9 | Slug generation |
| `time.test.ts` | 11 | Date/string conversions |
| `json.test.ts` | 7 | Safe JSON parsing with fallback |

### Writing Unit Tests

Test files are co-located with their source:

```
src/resolvers/helpers/
  slugify.ts          # Source
  slugify.test.ts     # Tests
```

For functions that use the logger, mock it to avoid file I/O:

```typescript
vi.mock('../../logger', () => ({
  logger: { warn: vi.fn() },
}));
```

## Integration Tests

**Config:** `stacker-api/vitest.integration.config.ts`
**Location:** `stacker-api/tests/integration/`

Integration tests exercise GraphQL resolvers against a real MariaDB database running in Docker. They test permissions, CRUD operations, validation, and safety guards.

### How It Works

1. **`globalSetup.ts`** starts a Docker MariaDB container on port 3307
2. **Prisma migrations** are applied to the test database
3. **Deterministic seed data** is loaded (fixed UUIDs, known users and permissions)
4. **Test files run sequentially** -- each resets and reseeds the database in `beforeAll`
5. **`globalTeardown`** stops and removes the Docker container

In CI, the test DB container joins a dedicated bridge network so the runner can reach it by container name.

### Directory Structure

```
tests/integration/
  setup/
    globalSetup.ts     # Docker container lifecycle + migrations
    testClient.ts      # Prisma client for the test DB
    testContext.ts      # Context factory with role presets
    seed.ts            # Deterministic test data
    constants.ts       # Fixed UUIDs for all test entities
    truncate.ts        # Reset all tables between test files
  auth.test.ts         # Sign-in, change password, reset flows
  books.test.ts        # Book CRUD + permissions
  authors.test.ts      # Author CRUD + validation
  reviews.test.ts      # Review CRUD + rating range
  groups.test.ts       # Group CRUD + system protection
  users.test.ts        # User management + admin guards
  permissions.test.ts  # Full permission matrix
```

### Test Seed Data

All test entities have fixed UUIDs in `constants.ts`:

- **3 users:** admin, editor, member (each with known email and bcrypt password)
- **3 permission groups:** Administrators, Editors, Members (with correct permissions)
- **2 authors:** Tolkien, Orwell
- **2 books:** The Hobbit, 1984

### Context Factory

`makeTestContext(preset)` creates a GraphQL context with preset role configurations:

```typescript
const adminCtx = makeTestContext('admin');           // All permissions
const editorCtx = makeTestContext('editor');          // Content permissions only
const memberCtx = makeTestContext('member');           // Read + review only
const unauthCtx = makeTestContext('unauthenticated'); // No userId
```

### What's Tested

| File | Tests | Coverage |
|------|-------|---------|
| `auth.test.ts` | 12 | Sign-in (valid, wrong password, non-existent, case), change password (success, wrong, short, unauth), request/reset (token, expiry, invalid) |
| `books.test.ts` | 7 | List, filter by genre, get by ID, create, update, permission denial, delete |
| `authors.test.ts` | 7 | List, get with count, create, update, validation (required, maxLength), permission denial, delete |
| `reviews.test.ts` | 7 | Create, update, rating range (1-5), permission denial, delete, query by book |
| `groups.test.ts` | 8 | List, get, create custom, update, delete, system protection, permission denial |
| `users.test.ts` | 10 | List, invite (success, duplicate, email validation, permission), update groups (success, last admin guard), remove (success, self-block, last admin guard, permission) |
| `permissions.test.ts` | 14 | Unauthenticated (7 checks), member (5), editor (4), admin (3) |

### Writing Integration Tests

Every test file starts with:

```typescript
import { testPrisma } from './setup/testClient';
import { makeTestContext } from './setup/testContext';
import { resetDatabase } from './setup/truncate';
import { seedTestData } from './setup/seed';
import * as C from './setup/constants';

beforeAll(async () => {
  await resetDatabase(testPrisma);
  await seedTestData(testPrisma);
});

afterAll(async () => {
  await testPrisma.$disconnect();
});
```

Import the resolver you're testing and call it directly with a test context:

```typescript
import { ContentMutations } from '../../src/resolvers/mutations/content';

it('creates a book', async () => {
  const ctx = makeTestContext('admin');
  const book = await ContentMutations.upsertBook(null, {
    input: { title: 'New Book', authorId: C.AUTHOR_TOLKIEN_ID },
  }, ctx);
  expect(book.title).toBe('New Book');
});

it('rejects without permission', async () => {
  const ctx = makeTestContext('member');
  await expect(
    ContentMutations.upsertBook(null, { input: { title: 'X', authorId: C.AUTHOR_TOLKIEN_ID } }, ctx)
  ).rejects.toThrow('Access denied');
});
```

### Requirements

- **Docker** must be running
- Port **3307** must be free (configurable via `TEST_DB_PORT`)
- Prisma client must be generated (`yarn run generate`)

## E2E Tests (Playwright)

**Config:** `stacker-ui/playwright.config.ts`
**Location:** `stacker-ui/e2e/`

E2E tests run against a real API and UI using Playwright. The config uses a single Chromium worker with serial execution and captures traces on first retry and screenshots on failure.

## CI Integration

Both unit and integration tests run in CI on every PR that changes `stacker-api/`:

```
yarn test               -> 83 unit tests
yarn test:integration   -> 63 integration tests (Docker MariaDB on port 3307)
yarn run build          -> TypeScript compilation
```

Test results are written to the GitHub Actions job summary.
