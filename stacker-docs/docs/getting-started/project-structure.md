---
sidebar_position: 3
---

# Project Structure

Stacker is a monorepo with four projects, shared scripts, and CI/CD configuration.

## Root

```
stacker/
  .github/
    deploy/
      docker-compose.yml      # Production compose file
      reset-db.sh              # Database reset script (runs on server)
    workflows/
      ci.yml                   # PR testing (selective per project)
      deploy.yml               # Build & deploy (dev -> test -> prod)
      reset-db.yml             # Manual database reset
      seed-sync.yml            # Manual seed data sync
  .husky/
    pre-commit                 # TypeScript + ESLint checks
    pre-push                   # Merged PR guard
  scripts/
    check-env.sh               # Verifies .env exists before dev
    ensure-docker-db.sh        # Starts local MariaDB container
    init-env.sh                # One-time environment setup
    kill-port.sh               # Kills process tree on port 4000
    push-env.sh                # Push local .env to Doppler
    sync-env.sh                # Pull .env from Doppler
  package.json                 # Root: Husky + convenience scripts
  docker-compose.yml           # Local dev database
```

## stacker-api

```
stacker-api/
  prisma/
    migrations/                # SQL migration files
    schema.prisma              # Database schema
    seed.ts                    # Seed script
  scripts/
    ensure-db.js               # Creates database if not exists
    export-seed.ts             # Exports DB to seed JSON
    reset-password.ts          # Interactive password reset
    write-prisma-barrel.js     # Generates Prisma barrel export
  src/
    context/
      index.ts                 # GraphQL context factory (auth, permissions)
      prisma.ts                # Prisma client singleton
    generated/prisma/          # Generated Prisma client (gitignored)
    lib/
      errors.ts                # extractErrorMessage utility
    resolvers/
      helpers/
        index.ts               # Auth guards + validation helpers
        slugify.ts             # String-to-slug utility
        time.ts                # DB time conversion utilities
        json.ts                # Safe JSON parse with fallback
        *.test.ts              # Co-located unit tests
      mutations/
        admin.ts               # User, group, and system mutations
        auth.ts                # Sign-in, password reset mutations
        content.ts             # Book, author, review mutations
      queries/
        index.ts               # All query resolvers
    schema/
      typeDefs.ts              # GraphQL SDL schema
    services/
      auth.ts                  # JWT + bcrypt utilities
    logger.ts                  # Pino logger with file rotation
    permissions.ts             # Permission definitions + group seeding
    index.ts                   # Express/Apollo server entry point
  tests/
    integration/
      setup/                   # Docker DB, test client, role presets, seed, truncate
      *.test.ts                # Integration tests (auth, books, authors, reviews, groups, users, permissions)
  eslint.config.mjs            # ESLint flat config
  vitest.config.ts             # Unit test config
  vitest.integration.config.ts # Integration test config
```

## stacker-ui

```
stacker-ui/
  e2e/                         # Playwright E2E tests
  src/
    components/
      layout/
        AppLayout.tsx          # Sidebar navigation + user menu
        ProtectedRoute.tsx     # Auth guard (redirect to sign-in)
        RequirePermission.tsx  # Permission guard (access denied UI)
        PublicLayout.tsx       # Layout for unauthenticated pages
      ui/                      # shadcn/ui components (Button, Dialog, etc.)
        SafeHtml.tsx           # DOMPurify XSS protection wrapper
    graphql/
      queries.ts               # All GraphQL operations
    lib/
      apollo.tsx               # Apollo Client with __typename stripping
      auth-context.tsx         # Auth provider (JWT + localStorage)
      env.ts                   # Runtime env helper (window.__ENV__ fallback)
      errors.ts                # extractErrorMessage utility
      use-auth.ts              # Auth hook
      use-permissions.ts       # Permissions hook
      utils.ts                 # cn() class merge utility
    pages/
      admin/                   # Users, Groups management
      content/                 # Books, Authors forms
      DashboardPage.tsx        # Dashboard with stats
      SignInPage.tsx            # Sign-in form
  nginx.conf                   # Production nginx with SPA routing + health check
  playwright.config.ts         # E2E test configuration
```

## stacker-cli

```
stacker-cli/
  src/
    index.ts                   # CLI entry point (Commander)
```

## stacker-docs

```
stacker-docs/
  docs/                        # Markdown documentation (this site)
  docusaurus.config.ts         # Docusaurus configuration
  sidebars.ts                  # Sidebar structure
```
