---
sidebar_position: 2
---

# Routing

The UI uses React Router v7 for client-side navigation with two layout groups.

## Route Structure

### Public Routes (PublicLayout)

```
/                  -> Redirects to /sign-in
/sign-in           -> Sign-in form
/forgot-password   -> Request password reset
/reset-password    -> Reset password (with token)
```

### Protected Routes (AppLayout)

All routes under `/app` require authentication. Unauthenticated users are redirected to `/sign-in` by the `ProtectedRoute` wrapper.

```
/app               -> Dashboard (stats overview)
/app/books         -> Books list           (requires books.view)
/app/books/new     -> Create book          (requires books.manage)
/app/books/:id     -> Edit book            (requires books.manage)
/app/authors       -> Authors list         (requires authors.view)
/app/authors/new   -> Create author        (requires authors.manage)
/app/authors/:id   -> Edit author          (requires authors.manage)
/app/users         -> User management      (requires users.manage)
/app/groups        -> Permission groups    (requires users.manage)
/app/groups/new    -> Create group         (requires users.manage)
/app/groups/:id    -> Edit group           (requires users.manage)
```

## Route Guards

### ProtectedRoute

Wraps the entire `/app` layout. Checks `isSignedIn` from `useAuth()`. Shows a loading spinner while auth state is being determined, redirects to `/sign-in` if not authenticated.

### RequirePermission

Wraps individual routes to enforce permissions. If the user lacks the required permission, an "Access Denied" message is shown instead of the page content.

```tsx
<Route path="books" element={
  <RequirePermission permission="books.view">
    <BooksPage />
  </RequirePermission>
} />
```

Supports checking any of multiple permissions:

```tsx
<RequirePermission anyPermission={["books.manage", "authors.manage"]}>
  <ContentPage />
</RequirePermission>
```

## Lazy Loading

All page components except `SignInPage` are lazy-loaded with `React.lazy()`:

```typescript
const BooksPage = lazy(() => import('@/pages/content/BooksPage'));
```

The entire route tree is wrapped in `Suspense` with a spinner fallback, so lazy chunks load seamlessly.

## Navigation

The sidebar in `AppLayout` is organized into two sections:

- **Content** -- Dashboard, Books, Authors
- **Administration** -- Users, Permission Groups

The sidebar highlights the active route and collapses to a sheet on mobile.
