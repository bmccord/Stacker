---
sidebar_position: 3
---

# Project Structure

Stacker is organized as a monorepo with multiple projects sharing a single Git repository.

## Top-Level Layout

```
stacker/
├── stacker-api/       # GraphQL API (Node.js + TypeScript)
├── stacker-ui/        # React web application
├── stacker-cli/       # CLI tool for data operations
├── stacker-docs/      # Developer documentation (this site)
└── README.md
```

## API Structure

```
stacker-api/
├── prisma/            # Schema, migrations, and seed data
├── src/
│   ├── graphql/       # Type definitions and resolvers
│   ├── middleware/     # Auth, tenant, error handling
│   ├── services/      # Business logic
│   └── index.ts       # Server entry point
└── tests/             # Unit and integration tests
```

## UI Structure

```
stacker-ui/
├── public/            # Static assets
├── src/
│   ├── components/    # Reusable UI components
│   ├── graphql/       # Queries and mutations
│   ├── lib/           # Utilities and helpers
│   ├── pages/         # Route page components
│   └── main.tsx       # App entry point
└── tests/             # E2E tests (Playwright)
```
