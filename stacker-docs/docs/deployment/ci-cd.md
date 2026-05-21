---
sidebar_position: 2
---

# CI/CD

Stacker uses GitHub Actions for continuous integration and deployment.

## Pipeline Overview

| Trigger | Action |
|---------|--------|
| PR to main | Build and test changed projects |
| Push to main | Build, deploy through dev, test, and prod |

## Deployment Tiers

1. **Dev** — Automatic deployment on push to main
2. **Test** — Deployed after dev succeeds, used for QA
3. **Prod** — Requires manual approval before deployment

## Selective Builds

Only changed projects are built and deployed. The pipeline detects which projects have changes and skips unchanged services, keeping deployments fast and focused.

## Versioning

Each service is versioned independently using git tags:

- `api/v1.2.0`
- `ui/v1.3.0`
- `cli/v1.0.0`
- `docs/v1.1.0`

Use `[major:api]` or `[breaking:ui]` in a commit message to bump the major version for a specific service.

## Container Registry

Docker images are pushed to GitHub Container Registry (GHCR) and deployed via SSH to standalone servers.
