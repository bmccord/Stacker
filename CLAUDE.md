# Stacker — GraphQL + React Starter Kit

A production-ready monorepo starter with four projects:

- **stacker-api** — Node.js/TypeScript GraphQL API (Apollo Server 4, Express 4, Prisma 7, MariaDB)
- **stacker-ui** — React/Vite web app (React Router v7, Apollo Client, shadcn/ui, Tailwind, React Hook Form)
- **stacker-cli** — TypeScript CLI for data export and seed generation
- **stacker-docs** — Docusaurus developer documentation site

## Quick Reference

### Local Dev

```bash
# API (creates DB, runs migrations, seeds, starts nodemon on :4000)
cd stacker-api && yarn dev

# UI (Vite dev server on :5173)
cd stacker-ui && yarn dev

# Docs (Docusaurus on :3001)
cd stacker-docs && yarn start --port 3001

# CLI
cd stacker-cli && yarn dev           # Run with tsx (dev)
cd stacker-cli && yarn build         # Build to dist/
```

### Common API Commands

```bash
cd stacker-api
yarn prisma generate                  # Regenerate Prisma client
yarn prisma migrate dev --name <name> # Create migration
yarn prisma db seed                   # Re-run seed
yarn test                             # Run unit tests
yarn test:integration                 # Run integration tests (Docker required)
```

### E2E Tests

```bash
cd stacker-ui
yarn test:e2e                         # Run E2E tests (Playwright + Docker)
yarn test:e2e:headed                  # Run with visible browser
```

---

## Architecture

### Auth

- **Web:** Custom JWT (HS256 via `jose`) in `Authorization: Bearer <token>`
- **CLI:** API key in `X-Api-Key` header
- **Local dev:** `DEV_ADMIN_USER_ID=dev-admin` bypasses auth
- Passwords hashed with `bcrypt` (12 rounds), JWTs expire after 7 days
- Permission groups: `Administrators` (full access), `Editors` (content management), `Members` (read-only + reviews)
- Users are invited by administrators (no self-registration)

### Data Model

- **Books** — title, author, genre, description, cover URL
- **Authors** — name, bio
- **Reviews** — rating (1-5), text, linked to book and user
- **Users** — email, password, name, email verification
- **Groups** — permission groups with role-based access control

### Permissions

```
books.view        — view books list and details
books.manage      — create, edit, delete books
authors.view      — view authors list and details
authors.manage    — create, edit, delete authors
reviews.view      — view reviews
reviews.manage    — create, edit, delete reviews
users.manage      — invite, edit, remove users
settings.manage   — manage application settings
```

### CI/CD

- **PR to main** → CI builds/tests only changed projects
- **Push to main** → Build & Deploy: selective builds per service
- **Per-service versioning**: git tags `api/v1.0.0`, `ui/v1.0.0`, etc.
- **Multi-tier deployment**: dev → test → prod with skip toggles
- Images pushed to GHCR, deployed via SSH + docker compose

---

## Environment Variables

### stacker-api/.env

| Variable | Description |
|---|---|
| `DATABASE_URL` | MariaDB connection string |
| `JWT_SECRET` | Secret key for signing/verifying JWTs (HS256) |
| `PORT` | API port (default 4000) |
| `DEV_ADMIN_USER_ID` | Bypasses auth. Never set in production. |
| `SEED_ADMIN_EMAIL` | Email for admin seed |
| `SEED_ADMIN_PASSWORD` | Password for admin seed |
| `SEED_ADMIN_FIRST_NAME` | First name for admin seed |
| `SEED_ADMIN_LAST_NAME` | Last name for admin seed |

### stacker-ui/.env

| Variable | Description |
|---|---|
| `VITE_API_URL` | GraphQL API URL |

### stacker-cli/.env

| Variable | Description |
|---|---|
| `STACKER_API_URL` | GraphQL API URL |
| `STACKER_API_KEY` | API key for CLI auth |
