---
sidebar_position: 2
---

# Routing

The Stacker UI uses React Router v7 for client-side navigation.

## Route Structure

Routes are organized by feature area:

```
/                     # Dashboard
/login                # Login page
/books                # Book list
/books/:id            # Book detail with reviews
/books/new            # Create book
/books/:id/edit       # Edit book
/users                # User management
/users/:id            # User detail
/settings             # Application settings
```

## Route Guards

Protected routes check for authentication and permissions before rendering. Unauthenticated users are redirected to `/login`. Users without required permissions see an access denied message.

## Lazy Loading

All page components are lazy-loaded using `React.lazy()` and `Suspense` to minimize the initial bundle size.
