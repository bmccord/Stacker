---
sidebar_position: 2
---

# Authentication

Stacker supports multiple authentication methods depending on the client type.

## Web Authentication (JWT)

The UI authenticates via JWT tokens:

1. User submits email and password to the `login` mutation
2. Server verifies credentials (bcrypt, 12 rounds)
3. Server returns a signed JWT (HS256 via `jose`, 7-day expiry)
4. Client sends the token in the `Authorization: Bearer <token>` header

## CLI Authentication (API Key)

The CLI authenticates via a shared API key:

- Client sends the key in the `X-Api-Key` header
- Server validates against the `WORSHIP_API_KEY` environment variable

## Dev Bypass

For local development, setting `DEV_ADMIN_USER_ID=dev-admin` in the API `.env` file bypasses authentication entirely. This should never be set in production.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing/verifying JWTs |
| `WORSHIP_API_KEY` | Shared secret for CLI auth |
| `DEV_ADMIN_USER_ID` | Dev-only auth bypass |
