---
sidebar_position: 6
---

# Resolvers

Resolvers implement the business logic behind each GraphQL query and mutation. They are organized by domain in `src/resolvers/`.

## Directory Structure

```
resolvers/
  helpers/
    index.ts               # Auth guards + validation + re-exports
    slugify.ts             # String-to-slug conversion
    time.ts                # DB time column helpers
    json.ts                # Safe JSON parse with fallback
    *.test.ts              # Co-located unit tests
  mutations/
    admin.ts               # User, group, and system mutations
    auth.ts                # Sign-in, password reset
    content.ts             # Book, author, review CRUD
  queries/
    index.ts               # All query resolvers
  index.ts                 # Combines queries + mutations
```

## Patterns

### Authorization

Every mutation starts with an authorization check. Two helpers are available:

```typescript
requireAuth(ctx);                    // Throws "Not authenticated" if no userId
requirePermission(ctx, 'books.manage'); // Throws "Access denied" if missing permission
```

### Upsert Pattern

Create and update share one mutation. If `input.id` is present, it's an update:

```typescript
upsertBook: async (_, { input }, ctx) => {
  requirePermission(ctx, 'books.manage');
  validateRequired(input.title, 'Title');

  if (input.id) {
    // Update
    const book = await ctx.prisma.books.update({ where: { id: input.id }, data: { ... } });
    return mapBook(book);
  }
  // Create
  const book = await ctx.prisma.books.create({ data: { ... } });
  return mapBook(book);
};
```

### Mappers

Database rows use `snake_case` columns but GraphQL types use `camelCase`. Mapper functions at the bottom of each file handle the conversion:

```typescript
function mapBook(b: BookWithRelations) {
  return {
    id: b.id,
    title: b.title,
    authorId: b.author_id,    // snake_case -> camelCase
    coverUrl: b.cover_url,
    createdAt: b.created_at.toISOString(),
  };
}
```

### Input Validation

Mutations validate inputs before database writes using helpers from `resolvers/helpers/`:

```typescript
validateRequired(input.title, 'Title');         // Non-empty
validateMaxLength(input.title, 300, 'Title');    // Max length
validateEmail(input.email);                      // Email format
validateRange(input.rating, 1, 5, 'Rating');     // Numeric range
validateSlug(input.slug);                        // Slug format
validateEnum(input.genre, GENRES, 'Genre');       // Allowed values
```

### Structured Logging

Resolvers log significant actions using the context logger:

```typescript
ctx.log.info({ bookId: book.id }, 'Created book');
ctx.log.info({ userId }, 'Removed user');
```

## Utility Modules

### slugify

Converts strings to URL-friendly slugs: `"Hello World!"` -> `"hello-world"`.

### safeJsonParse

Parses JSON with a fallback value instead of throwing on malformed input. Logs a warning on parse failure.

### dbTimeToString / timeStringToDate

Convert between MySQL TIME columns (returned as Date objects) and `"HH:MM"` strings.

### extractErrorMessage

Normalizes Apollo GraphQL errors, standard Error objects, and unknown types into user-friendly strings. Available in both API (`src/lib/errors.ts`) and UI (`src/lib/errors.ts`).
