---
sidebar_position: 8
---

# Environment Variables

Stacker manages environment variables through a combination of automated scripts and optional Doppler integration.

## Setup

### First Time

```bash
yarn init-env
```

This interactive script:

1. **Detects Doppler** -- if installed and authenticated, uses it for centralized secrets. Otherwise, generates everything locally.
2. **Prompts for your info** -- first name, last name, email
3. **Generates secrets** -- JWT secret (`openssl rand -base64 32`), API key (`sk-` prefix + random hex), dev password
4. **Writes `.env` files** -- `stacker-api/.env`, `stacker-ui/.env`, `stacker-cli/.env`, root `.env`
5. **Starts MariaDB** -- ensures the Docker container is running

### Flags

| Flag | Purpose |
|------|---------|
| `--sync` | Regenerate `.env` files without prompts (Doppler mode only) |
| `--local` | Force local mode even if Doppler is installed |

## With Doppler (Teams)

When Doppler is configured, secrets are stored centrally:

- **Shared secrets** (JWT, API key, DB password) live in the `local` config
- **Per-developer secrets** (email, password, name) live in `local_<username>` branch configs
- `yarn dev` automatically syncs `.env` from Doppler before starting

### Doppler Scripts

| Command | Script | Purpose |
|---------|--------|---------|
| `yarn init-env` | `scripts/init-env.sh` | One-time setup (Doppler auth + personal config + .env generation) |
| `yarn sync-env` | `scripts/sync-env.sh` | Pull latest .env from Doppler (runs on every `yarn dev`) |
| `yarn push-env` | `scripts/push-env.sh` | Push local .env changes to Doppler (classifies as shared vs personal) |

### Drift Detection

`sync-env.sh` compares local `.env` files against Doppler before overwriting. If local changes are detected:

- Shows a diff of what's different
- Skips the overwrite to prevent data loss
- Suggests running `yarn push-env` first or `yarn sync-env --force` to overwrite

## Without Doppler (Solo)

All secrets are generated locally and stored directly in `.env` files. `sync-env.sh` exits silently when Doppler isn't available, so `yarn dev` works without it.

## Variables Reference

### stacker-api/.env

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | Auto-generated | MariaDB connection string |
| `JWT_SECRET` | Yes | Auto-generated | Secret for signing JWTs |
| `PORT` | No | `4000` | API server port |
| `DEV_ADMIN_USER_ID` | No | `dev-admin` | Auth bypass for local dev |
| `STACKER_API_KEY` | Yes | Auto-generated | Shared secret for CLI auth |
| `SEED_ADMIN_EMAIL` | Yes | Prompted | Admin user email |
| `SEED_ADMIN_PASSWORD` | Yes | Auto-generated | Admin user password |
| `SEED_ADMIN_FIRST_NAME` | Yes | Prompted | Admin first name |
| `SEED_ADMIN_LAST_NAME` | Yes | Prompted | Admin last name |
| `LOG_LEVEL` | No | `info` | Pino log level |
| `LOG_DIR` | No | `./logs` | Log file directory |
| `APP_VERSION` | No | `dev` | Reported by `apiVersion` query |
| `NODE_ENV` | No | -- | `production` for JSON logs |

### stacker-ui/.env

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `VITE_API_URL` | No | `http://localhost:4000/graphql` | GraphQL API endpoint |

### stacker-cli/.env

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STACKER_API_URL` | Yes | Auto-generated | GraphQL API endpoint |
| `STACKER_API_KEY` | Yes | Auto-generated | Must match API's `STACKER_API_KEY` |

### Root .env

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DB_ROOT_PASSWORD` | No | `devpass123` | Used by `ensure-docker-db.sh` |

## Password Management

```bash
# Reset your local dev password (updates DB + .env + Doppler)
yarn reset-password
```

The `reset-password` script prompts for a new password (min 8 characters), updates the database with a bcrypt hash, updates `SEED_ADMIN_PASSWORD` in `.env`, and pushes to Doppler if configured.
