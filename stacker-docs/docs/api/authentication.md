---
sidebar_position: 3
---

# Authentication

Stacker supports three authentication methods. The context factory (`src/context/index.ts`) checks them in order -- the first one that succeeds wins.

## 1. Dev Bypass

If `DEV_ADMIN_USER_ID` is set in `.env`, that value becomes the userId and the user gets **all permissions** automatically. No JWT is needed. This is the default for local development.

**Never set this in production.**

When commented out in `.env`, the API falls through to real JWT auth and you must sign in.

## 2. API Key (CLI)

The CLI authenticates via a shared API key in the `X-Api-Key` header. The server validates it against the `STACKER_API_KEY` environment variable. CLI requests get all permissions.

## 3. JWT (Web UI)

The UI authenticates via JWT tokens:

1. User submits email and password to the `signIn` mutation
2. Server verifies credentials with bcrypt (12 rounds)
3. Server returns a signed JWT (HS256 via `jose`, 7-day expiry) and user data
4. Client stores the token in `localStorage` and sends it in the `Authorization: Bearer <token>` header on every request

### Password Flows

**Sign In** -- `signIn(email, password)` returns `{ token, user }`. Email is normalized to lowercase.

**Change Password** -- `changePassword(currentPassword, newPassword)` requires authentication. New password must be at least 8 characters.

**Forgot Password** -- `requestPasswordReset(email)` generates a 1-hour reset token. Always returns `true` (doesn't leak whether the email exists). Currently logs the token but does not send email (TODO).

**Reset Password** -- `resetPassword(token, password)` validates the token, sets the new password, clears the token, marks the email as verified, and returns a JWT for automatic sign-in.

## Auth Service

The auth service (`src/services/auth.ts`) provides four functions:

| Function | Purpose |
|----------|---------|
| `hashPassword(password)` | Bcrypt hash with 12 rounds |
| `verifyPassword(password, hash)` | Bcrypt compare |
| `generateToken(userId)` | Create HS256 JWT with 7-day expiry |
| `verifyToken(token)` | Verify and decode JWT, returns `{ sub: userId }` |

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JWT_SECRET` | Secret key for signing/verifying JWTs (required) |
| `STACKER_API_KEY` | Shared secret for CLI auth |
| `DEV_ADMIN_USER_ID` | Dev-only auth bypass (comment out to test real auth) |
