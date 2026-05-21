---
sidebar_position: 1
---

# Docker

Stacker includes production-ready Dockerfiles for both the API and UI.

## API Container

The API Dockerfile uses a multi-stage build:

1. **Build stage** — Installs dependencies and compiles TypeScript
2. **Production stage** — Copies only the compiled output and production dependencies

```bash
cd stacker-api
docker build -t stacker-api .
docker run -p 4000:4000 --env-file .env stacker-api
```

## UI Container

The UI is built as static files and served via nginx:

1. **Build stage** — Runs `yarn build` to produce optimized static assets
2. **Serve stage** — Copies the build output into an nginx container

```bash
cd stacker-ui
docker build -t stacker-ui .
docker run -p 80:80 stacker-ui
```

## Docker Compose

For local development with all services:

```bash
docker compose up
```

This starts the API, UI, and MariaDB database together.
