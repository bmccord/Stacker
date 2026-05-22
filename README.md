# Stacker

A production-ready GraphQL + React starter kit built with modern TypeScript. Clone it, run one command, and start building.

## Features

- **GraphQL API** — Apollo Server 4, Express, Prisma 7, MariaDB
- **React UI** — Vite, React Router v7, Apollo Client, shadcn/ui, Tailwind CSS
- **CLI Tool** — Data export and seed generation
- **Documentation** — Docusaurus developer docs
- **Auth** — Custom JWT with bcrypt passwords, role-based permission groups
- **Testing** — Unit tests (Vitest), integration tests (Docker), E2E tests (Playwright)
- **CI/CD** — GitHub Actions with selective builds and multi-tier deployment
- **DX** — Doppler env management, Husky git hooks, one-command setup

## Projects

| Project | Technology | Description |
|---------|-----------|-------------|
| **stacker-api** | Node.js, Apollo Server, Prisma, MariaDB | GraphQL API with all business logic |
| **stacker-ui** | React, Vite, Tailwind CSS, shadcn/ui | Web application |
| **stacker-cli** | Node.js, TypeScript, Commander | CLI for data export and seed generation |
| **stacker-docs** | Docusaurus | Developer documentation |

## Quick Start

### Prerequisites

- Node.js 24+
- Yarn (via `corepack enable`)
- Docker (for MariaDB)
- [Doppler CLI](https://docs.doppler.com/docs/install-cli) (optional, for team secrets management)

### Setup

```bash
git clone https://github.com/bmccord/Stacker.git
cd Stacker

# Install dependencies
cd stacker-api && yarn install && cd ..
cd stacker-ui && yarn install && cd ..

# Set up environment (prompts for name/email, generates secrets, starts database)
yarn init-env
```

The `init-env` command handles everything:
1. Prompts for your name and email
2. Generates a local dev password, JWT secret, and API key
3. Creates all `.env` files
4. Starts a MariaDB Docker container

If Doppler is installed, it stores secrets there for team sharing. Without Doppler, it generates `.env` files locally — no account required.

### Run

**WebStorm / IntelliJ:** Use the included run configurations from the toolbar dropdown — `Stacker API`, `Stacker UI`, or `Stacker API + UI` to start both together.

**Terminal:**

```bash
# Terminal 1 — API (creates DB, runs migrations, seeds, starts on port 4000)
cd stacker-api && yarn dev

# Terminal 2 — UI (Vite dev server on port 5173)
cd stacker-ui && yarn dev
```

### Useful Commands

```bash
# From repo root
yarn reset-password              # Change your local dev password (updates DB + .env + Doppler)
yarn sync-env                    # Regenerate .env files from Doppler
yarn push-env                    # Push local .env changes to Doppler

# From stacker-api/
yarn test                        # Run unit tests (83 tests)
yarn test:watch                  # Run unit tests in watch mode
yarn test:integration            # Run integration tests (63 tests, Docker required)
yarn test:integration:watch      # Run integration tests in watch mode
yarn prisma migrate dev --name x # Create a new migration
yarn prisma db seed              # Re-run seed
yarn seed:export                 # Export current database to seed JSON files
yarn lint                        # Run ESLint

# From stacker-ui/
yarn test:e2e                    # Run E2E tests (Playwright)
yarn test:e2e:headed             # Run E2E with visible browser
yarn test:e2e:ui                 # Run E2E with Playwright interactive UI
```

## Documentation

Full developer documentation is available locally:

```bash
cd stacker-docs && yarn install && yarn start --port 3001
```

## CI/CD

- **Pull requests** — Builds and tests only the projects that changed
- **Push to main** — Builds Docker images, pushes to GHCR, deploys through dev -> test -> prod
- **Semantic versioning** — Auto minor bump per build; include `[major]` in commit message for major version bumps

## License

MIT
