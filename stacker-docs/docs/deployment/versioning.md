---
sidebar_position: 3
---

# Versioning

Stacker uses per-service semantic versioning via git tags.

## Tag Format

```
<service>/v<MAJOR>.<MINOR>.0
```

Examples: `api/v1.0.0`, `ui/v1.3.0`, `cli/v1.0.0`, `docs/v1.1.0`

Each service is versioned independently. Only services that have changed get a new version on each deploy.

## Version Calculation

The `deploy.yml` workflow computes versions automatically:

1. Find the latest tag for the service (e.g., `api/v1.2.0`)
2. Check if the service has changed in this push
3. Determine bump type:
   - **Minor bump** (default) -- `v1.2.0` -> `v1.3.0`
   - **Major bump** -- `v1.2.0` -> `v2.0.0`
4. Create and push the new git tag
5. Pass the version to the Docker build job

## Major Version Bumps

Three ways to trigger a major bump:

### Commit Message

Include a marker in the commit message:

```bash
# Bump a specific service
git commit -m "Rewrite auth flow [major:api]"
git commit -m "Breaking UI changes [breaking:ui]"

# Bump all changed services
git commit -m "Major refactor [major]"
git commit -m "Breaking changes everywhere [breaking]"
```

### Manual Dispatch

The deploy workflow has checkbox inputs for major bumps:

- `major_api` -- major version bump for API
- `major_ui` -- major version bump for UI

## Version in the App

The API version is available via the `apiVersion` GraphQL query. In production, this returns the Docker image tag (e.g., `1.3.0`). In development, it returns `dev`.

```graphql
query { apiVersion }
```

The UI receives `APP_VERSION` as a build arg during Docker build.
