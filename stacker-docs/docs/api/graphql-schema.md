---
sidebar_position: 5
---

# GraphQL Schema

The schema is defined as SDL in `src/schema/typeDefs.ts` and exposed at `/graphql`.

## Types

### Domain Types

```graphql
type Book {
  id: String!
  title: String!
  authorId: String!
  author: Author
  genre: String
  description: String
  coverUrl: String
  averageRating: Float
  reviewCount: Int!
  createdAt: String!
}

type Author {
  id: String!
  name: String!
  bio: String
  bookCount: Int!
  createdAt: String!
}

type Review {
  id: String!
  bookId: String!
  userId: String!
  userName: String
  rating: Int!
  text: String
  createdAt: String!
}
```

### Auth & Admin Types

```graphql
type User {
  id: String!
  email: String!
  firstName: String
  lastName: String
  emailVerified: Boolean!
  createdAt: String!
}

type AuthPayload {
  token: String!
  user: User!
}

type Group {
  id: String!
  name: String!
  slug: String!
  description: String
  isSystem: Boolean!
  permissions: [String!]!
  memberCount: Int!
}

type AppUser {
  id: String!
  email: String!
  firstName: String
  lastName: String
  emailVerified: Boolean!
  groups: [Group!]!
  createdAt: String!
}
```

### System Types

```graphql
type LogEntry {
  level: Int!
  levelLabel: String!
  time: String!
  msg: String!
  data: String
}

type LogResult {
  entries: [LogEntry!]!
  total: Int!
}

type DashboardStats {
  bookCount: Int!
  authorCount: Int!
  reviewCount: Int!
  userCount: Int!
}
```

## Input Types

All create/update operations use the **upsert pattern** -- if `id` is present, it's an update; if absent, it's a create.

```graphql
input UpsertBookInput {
  id: String          # Omit for create, include for update
  title: String!
  authorId: String!
  genre: String
  description: String
  coverUrl: String
}

input UpsertAuthorInput {
  id: String
  name: String!
  bio: String
}

input UpsertReviewInput {
  id: String
  bookId: String!
  rating: Int!        # 1-5
  text: String
}

input CreateGroupInput {
  name: String!
  description: String
  permissions: [String!]!
}

input UpdateGroupInput {
  id: String!
  name: String
  description: String
  permissions: [String!]
}
```

## Queries

```graphql
type Query {
  # Public
  books(genre: String): [Book!]!
  book(id: String!): Book
  authors: [Author!]!
  author(id: String!): Author
  bookReviews(bookId: String!): [Review!]!

  # Authenticated
  me: User
  myPermissions: [String!]!
  dashboardStats: DashboardStats!
  allPermissions: [PermissionCategory!]!

  # Admin (users.manage)
  users: [AppUser!]!
  groups: [Group!]!
  group(id: String!): Group

  # System (settings.manage)
  systemLogs(limit: Int, offset: Int, level: String,
             search: String, startDate: String, endDate: String): LogResult!
  systemLogLevel: String!

  # API version
  apiVersion: String!
}
```

## Mutations

```graphql
type Mutation {
  # Auth (public)
  signIn(email: String!, password: String!): AuthPayload!
  requestPasswordReset(email: String!): Boolean!
  resetPassword(token: String!, password: String!): AuthPayload!

  # Auth (authenticated)
  changePassword(currentPassword: String!, newPassword: String!): Boolean!

  # Content (requires *.manage permission)
  upsertBook(input: UpsertBookInput!): Book!
  deleteBook(id: String!): Boolean!
  upsertAuthor(input: UpsertAuthorInput!): Author!
  deleteAuthor(id: String!): Boolean!
  upsertReview(input: UpsertReviewInput!): Review!
  deleteReview(id: String!): Boolean!

  # Users (users.manage)
  inviteUser(email: String!, groupIds: [String!]!): Boolean!
  updateUserGroups(userId: String!, groupIds: [String!]!): AppUser!
  removeUser(userId: String!): Boolean!

  # Groups (users.manage)
  createGroup(input: CreateGroupInput!): Group!
  updateGroup(input: UpdateGroupInput!): Group!
  deleteGroup(id: String!): Boolean!

  # System (settings.manage)
  setSystemLogLevel(level: String!): Boolean!
}
```

## Exploring the Schema

Use any GraphQL client to browse the full schema at `http://localhost:4000/graphql`. Apollo Server's built-in landing page provides a link to Apollo Studio Explorer.
