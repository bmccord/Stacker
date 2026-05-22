---
sidebar_position: 2
---

# Local Setup

Step-by-step guide to getting Stacker running on your local machine.

## 1. Clone the Repository

```bash
git clone https://github.com/bmccord/Stacker.git
cd Stacker
```

## 2. Install Dependencies

Each project manages its own dependencies. Install them separately:

```bash
# API
cd stacker-api && yarn install

# UI
cd ../stacker-ui && yarn install

# Docs (optional)
cd ../stacker-docs && yarn install
```

## 3. Set Up Environment Variables

From the repo root, run:

```bash
yarn init-env
```

This single command handles everything:

1. **Doppler detection** — if Doppler CLI is installed and authenticated, uses it for centralized secrets. Otherwise, generates everything locally.
2. **Developer account** — prompts for your name and email, generates a local dev password
3. **Secret generation** — creates a JWT secret and API key automatically
4. **`.env` files** — generates `stacker-api/.env`, `stacker-ui/.env`, `stacker-cli/.env`, and root `.env`
5. **Database** — starts a MariaDB Docker container (`stacker-local-db`) with persistent storage

:::tip Re-running init-env
You can run `yarn init-env` again at any time to reconfigure your settings or regenerate `.env` files. Use `yarn init-env --local` to force local mode even if Doppler is installed.
:::

### What's in each `.env` file

You do not need to create or edit these — `init-env` handles it.

| File | Key variables |
|------|---------------|
| `stacker-api/.env` | `DATABASE_URL`, `JWT_SECRET`, `PORT`, `STACKER_API_KEY`, `SEED_ADMIN_*`, `DEV_ADMIN_USER_ID` |
| `stacker-ui/.env` | `VITE_API_URL` |
| `stacker-cli/.env` | `STACKER_API_URL`, `STACKER_API_KEY` |
| `.env` (root) | `DB_ROOT_PASSWORD` |

### With Doppler (teams)

Shared secrets are stored in Doppler's `local` environment. Per-developer values are stored in your personal branch config (`local_<username>`). When shared secrets change, `yarn dev` automatically syncs the latest values before starting.

### Without Doppler (solo)

All secrets are generated locally and stored in `.env` files. You manage them directly. To switch to Doppler later, install the CLI and re-run `yarn init-env`.

## 4. Start the API

```bash
cd stacker-api
yarn dev
```

This single command does a lot. Here is what happens in order:

1. **Check `.env`** — verifies `.env` exists; tells you to run `yarn init-env` if not
2. **Sync `.env`** — pulls latest secrets from Doppler (if configured; skips silently otherwise)
3. **Ensure database** — starts the MariaDB Docker container if it's not running
4. **Kill port 4000** — if a previous server is still running, kills the entire process tree
5. **Create database** — creates the `stacker-local` database if it doesn't exist
6. **Generate Prisma client** — runs `prisma generate` and creates the barrel export file
7. **Apply migrations** — runs `prisma migrate deploy` to bring the schema up to date
8. **Seed data** — populates the database with permission groups, admin user, and sample books/authors. Idempotent — skips data that already exists.
9. **Start the server** — launches Express/Apollo with **nodemon**, which watches `src/` and auto-restarts on changes

The API is ready when you see the server listening message on **port 4000**.

## 5. Start the UI

In a second terminal:

```bash
cd stacker-ui
yarn dev
```

This starts the Vite dev server on **port 5173** with hot module replacement. Changes to React components appear in the browser instantly.

## 6. Start the Docs (Optional)

```bash
cd stacker-docs
yarn start --port 3001
```

## 7. Verify Everything Works

| Service | URL | Expected |
|---------|-----|----------|
| UI | [http://localhost:5173](http://localhost:5173) | Sign-in page loads |
| API | [http://localhost:4000/graphql](http://localhost:4000/graphql) | Returns 400 (needs a query body — this is normal) |
| Docs | [http://localhost:3001](http://localhost:3001) | Documentation site loads |

Sign in with the email and password shown during `yarn init-env` setup.

## IDE Setup

### WebStorm / IntelliJ

The repo includes pre-built run configurations in `.idea/runConfigurations/`:

- **Stacker API** — runs `yarn dev` in the API project
- **Stacker UI** — runs `yarn dev` in the UI project
- **Stacker API + UI** — compound config that starts both sequentially
- **Stacker Unit Tests** / **Stacker Integration Tests** — test runners

Use the toolbar dropdown or Run menu. Each config runs `yarn install` before launch.

### VS Code

Open the `Stacker` directory as your workspace. Split the terminal to run API and UI side-by-side:

1. Open terminal, run `cd stacker-api && yarn dev`
2. Split terminal (Ctrl+Shift+5), run `cd stacker-ui && yarn dev`

## Common Commands

### API

```bash
yarn dev                              # Full startup sequence (see above)
yarn prisma generate                  # Regenerate Prisma client after schema changes
yarn prisma migrate dev --name <name> # Create a new migration
yarn prisma db seed                   # Re-run seed (idempotent)
yarn build                            # Compile TypeScript
yarn test                             # Run unit tests (83 tests)
yarn test:watch                       # Run unit tests in watch mode
yarn test:integration                 # Run integration tests (63 tests, Docker required)
yarn test:integration:watch           # Run integration tests in watch mode
yarn lint                             # Run ESLint
yarn reset-password                   # Set new local dev password (updates DB, .env, Doppler)
yarn seed:export                      # Export current database to seed JSON files
```

### UI

```bash
yarn dev              # Start Vite dev server
yarn build            # Production build
yarn lint             # Run ESLint
yarn test:e2e         # Run E2E tests (Playwright)
yarn test:e2e:headed  # Run E2E tests with visible browser
yarn test:e2e:ui      # Run E2E tests with Playwright interactive UI
```

### CLI

```bash
cd stacker-cli
yarn dev              # Run with tsx (dev mode)
yarn build            # Build to dist/
```

### Docs

```bash
cd stacker-docs
yarn start --port 3001   # Dev server
yarn build               # Build static site
```

## Git Hooks

Stacker uses [Husky](https://typicode.github.io/husky/) for automated checks on every commit and push.

### Pre-Commit

Runs TypeScript type checking (`tsc --noEmit`) and ESLint (`--quiet`) on both the API and UI. If either has type errors or lint errors, the commit is rejected.

For the UI, the hook targets `tsconfig.app.json` directly because the root `tsconfig.json` uses project references with `"files": []`.

### Pre-Push

Checks whether the current branch has a merged PR on GitHub. If so, the push is blocked:

```
ERROR: Branch 'feature/old-branch' has a merged PR (#42).
Pushing to this branch will NOT update main.

Create a new branch instead:
  git checkout main && git pull && git checkout -b fix/your-fix-name
```

Skips the check for pushes to `main` and gracefully does nothing if `gh` is not installed.

## After Schema Changes

When you modify `stacker-api/prisma/schema.prisma`:

```bash
cd stacker-api
yarn prisma migrate dev --name describe-your-change  # Create migration + apply
yarn prisma generate                                  # Regenerate Prisma client types
```

Restart the API server after generating — nodemon won't pick up generated file changes automatically.

## Troubleshooting

**Port 4000 already in use** — The `yarn dev` script kills existing processes automatically. If it fails, manually run `lsof -ti:4000 | xargs kill -9`.

**Prisma migration errors** — If your local database is out of sync, drop and recreate it. `yarn dev` will re-run migrations and seed.

**Forgot your local dev password** — Run `yarn reset-password` from the repo root. Or check your `stacker-api/.env` file for `SEED_ADMIN_PASSWORD`.

**Type errors after pulling** — Run `yarn prisma migrate deploy && yarn prisma generate` to update your local schema and regenerate the client.

**Missing `.env` files** — Run `yarn init-env` from the repo root.

**Docker not running** — Make sure Docker Desktop is running (macOS/Windows) or the Docker service is started (`sudo systemctl start docker` on Linux).

**`corepack enable` permission error** — Try `sudo corepack enable` (macOS/Linux) or run the terminal as Administrator (Windows).
