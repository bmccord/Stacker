---
sidebar_position: 4
---

# Permissions

Stacker uses a group-based permission system with dot-notation permission strings.

## Available Permissions

| Permission | Description |
|-----------|-------------|
| `books.view` | View books list and details |
| `books.manage` | Create, edit, delete books |
| `authors.view` | View authors list and details |
| `authors.manage` | Create, edit, delete authors |
| `reviews.view` | View reviews |
| `reviews.manage` | Create, edit, delete reviews |
| `users.manage` | Invite, edit, remove users and manage groups |
| `settings.manage` | Manage system settings (log level, etc.) |

## Default Groups

Three system groups are created by the seed script. They cannot be deleted but their permissions can be modified.

| Group | Permissions | Description |
|-------|------------|-------------|
| **Administrators** | All 8 permissions | Full access to everything |
| **Editors** | `books.*`, `authors.*`, `reviews.view` | Content management |
| **Members** | `books.view`, `authors.view`, `reviews.*` | Browse and review |

## How It Works

1. Each user is assigned to one or more groups
2. On every request, the context factory loads the user's group memberships and collects all permissions into a `Set<string>`
3. Resolvers call `requirePermission(ctx, 'books.manage')` to check access
4. Permissions are **additive** -- a user in both Editors and Members gets the union of both sets

## Enforcement

### API Side

Resolvers use two helper functions from `resolvers/helpers/`:

- `requireAuth(ctx)` -- throws `"Not authenticated"` if no userId
- `requirePermission(ctx, permission)` -- calls `requireAuth`, then throws `"Access denied"` if the permission isn't in the set

### UI Side

The `RequirePermission` component wraps routes to show an "Access Denied" message when the user lacks a permission:

```tsx
<RequirePermission permission="books.manage">
  <BookFormPage />
</RequirePermission>
```

Supports checking any of multiple permissions:

```tsx
<RequirePermission anyPermission={["books.manage", "authors.manage"]}>
  <ContentPage />
</RequirePermission>
```

The `usePermissions()` hook fetches the current user's permissions from the `myPermissions` query and returns a `Set<string>`.

## Safety Guards

- **Cannot remove yourself** -- the `removeUser` mutation blocks self-deletion
- **Cannot remove the last admin** -- if the user being removed is the only member of the Administrators group, the mutation throws
- **Cannot demote the last admin** -- `updateUserGroups` blocks removing the last user from Administrators
- **Cannot delete system groups** -- the Administrators, Editors, and Members groups are marked `is_system: true`

## Adding New Permissions

1. Add the permission string to `ALL_PERMISSIONS` in `src/permissions.ts`
2. Add it to the appropriate `PERMISSION_GROUPS` category for the UI
3. Add it to the relevant default group in `DEFAULT_GROUPS` if applicable
4. Use `requirePermission(ctx, 'your.new.permission')` in the resolver
5. Wrap the UI route with `<RequirePermission permission="your.new.permission">`
