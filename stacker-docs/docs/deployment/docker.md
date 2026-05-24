---
sidebar_position: 1
---

# Docker

Stacker includes production-ready Dockerfiles for the API and UI, plus `.dockerignore` files to keep images lean.

## API Container

Single-stage build on `node:24-alpine`:

1. Enable Corepack and install dependencies (`yarn install --immutable`)
2. Copy Prisma config, schema, source, and scripts
3. Run `yarn run generate` (Prisma client + barrel export)
4. Run `yarn run build` (TypeScript compilation)
5. Copy `docker-entrypoint.sh`

The entrypoint runs on every container start:

```bash
node scripts/ensure-db.js        # Create database if not exists
yarn prisma migrate deploy       # Apply pending migrations
yarn prisma db seed               # Seed data (idempotent)
exec node dist/index.js           # Start the server
```

```bash
cd stacker-api
docker build -t stacker-api .
docker run -p 4000:4000 --env-file .env stacker-api
```

## UI Container

Multi-stage build:

1. **Build stage** (`node:22-alpine`) -- installs dependencies and runs `yarn build` to produce optimized static assets
2. **Serve stage** (`nginx:alpine`) -- copies the build output, `nginx.conf`, and `docker-entrypoint.sh`

The entrypoint generates `env-config.js` at runtime, injecting `VITE_*` environment variables into `window.__ENV__` so the app can be configured without rebuilding.

The nginx config includes:
- SPA routing (`try_files $uri $uri/ /index.html`)
- No-cache headers for `env-config.js` (ensures fresh env on deploy)
- Health check endpoint at `/health` (returns 200 "ok" with CORS headers)

```bash
cd stacker-ui
docker build -t stacker-ui .
docker run -p 80:80 -e VITE_API_URL=https://api.example.com/graphql stacker-ui
```

## Docker Compose

### Local Development

The root `docker-compose.yml` provides MariaDB for local development:

```bash
docker compose up -d    # Start database only
```

This is what `scripts/ensure-docker-db.sh` manages automatically during `yarn dev`.

### Production Deployment

A separate compose file at `.github/deploy/docker-compose.yml` defines the full production stack (API, UI, Docs) with environment variable substitution for image tags, ports, and secrets.

## .dockerignore

Each project has a `.dockerignore` that excludes `node_modules`, `dist`, `.env`, and `logs` from the Docker build context. This speeds up builds and prevents secrets from being baked into images.
