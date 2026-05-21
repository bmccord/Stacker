---
sidebar_position: 3
---

# Permissions

Stacker uses a group-based permission system for fine-grained access control.

## Permission Groups

Permission groups define what actions users can perform. Each group has a set of permissions, and users can belong to multiple groups.

### Default Groups

| Group | Permissions | Notes |
|-------|------------|-------|
| **Administrators** | Full access | System group, cannot be deleted |
| **User Managers** | `users.manage`, `users.approve` | Can invite and manage users |
| **Members** | None | Default group for new users |

## How It Works

1. Each user is assigned to one or more permission groups
2. Resolvers check for required permissions via middleware
3. Permissions are additive — a user has the union of all permissions from all their groups

## Sign-Up Modes

| Mode | Behavior |
|------|----------|
| `invite_only` | Admin sends invite email with temporary password |
| `open` | Self-registration with immediate access |
| `open_approval` | Self-registration, admin must approve before access is granted |
