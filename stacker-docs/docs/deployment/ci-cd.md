---
sidebar_position: 2
---

# CI/CD

Stacker uses GitHub Actions for continuous integration and deployment, with four workflow files.

## Workflows

### CI (`ci.yml`)

**Trigger:** Pull requests to main, manual dispatch

1. **Detect Changes** -- `git diff` determines which projects changed (API, UI, CLI, Docs)
2. **Build jobs** -- only run for changed projects:
   - **API:** Install, generate Prisma client, run unit tests, build TypeScript
   - **UI:** Install, build (tsc + vite)
   - **CLI:** Install, build
   - **Docs:** Install, build (Docusaurus)
3. **Disk space check** -- each job checks available disk space and clears caches if below 1GB (for self-hosted runners)
4. **Test summary** -- API test results are written to the GitHub Actions step summary

### Deploy (`deploy.yml`)

**Trigger:** Push to main, manual dispatch

1. **Detect Changes** -- same as CI
2. **Compute Versions** -- calculates semantic versions per service from git tags
3. **Build Images** -- Docker build and push to GHCR for changed services
4. **Deploy** -- sequential deployment through dev -> test -> prod via SSH

Each deploy step SCPs the compose file, writes a `.env` with secrets, pulls images, and runs `docker compose up -d`.

### Reset Database (`reset-db.yml`)

**Trigger:** Manual dispatch only

Resets the database in any environment. Drops and recreates the database via the API container, then restarts it (which auto-runs migrations and seed). Production requires typing "RESET PRODUCTION" as a safety gate.

### Seed Sync (`seed-sync.yml`)

**Trigger:** Manual dispatch only

Pushes seed data to any environment. SCPs the `prisma/seed-data/` directory to the server, copies it into the API container, and runs `yarn prisma db seed`. Same production safety gate.

## Selective Builds

The CI and Deploy workflows use a shared `changes` job to detect which projects were modified. Only changed projects are built, tested, and deployed. Unchanged services are completely skipped.

## Deployment Architecture

- **Method:** SSH + docker compose
- **Registry:** GitHub Container Registry (GHCR)
- **Environments:** dev, test, production (GitHub Environments with separate secrets)
- **Deploy vars:** `DEPLOY_USER`, `DEPLOY_HOST`, `DEPLOY_PATH` (per environment)

## Branch Protection

The `main` branch is protected with a repository ruleset:

- Pull request required (1 approval)
- Stale reviews dismissed on push
- Review thread resolution required
- "Detect Changes" status check must pass
- Branch must be up to date with main
- Repository admins can bypass
