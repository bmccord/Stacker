---
sidebar_position: 4
---

# GraphQL Schema

The Stacker API exposes a single GraphQL endpoint at `/graphql`.

## Core Types

The example bookshelf application includes the following primary types:

```graphql
type Book {
  id: ID!
  title: String!
  author: String!
  genre: String
  description: String
  coverUrl: String
  reviews: [Review!]!
  averageRating: Float
}

type Review {
  id: ID!
  rating: Int!
  comment: String
  user: User!
  book: Book!
  createdAt: DateTime!
}

type User {
  id: ID!
  email: String!
  firstName: String!
  lastName: String!
  groups: [PermissionGroup!]!
}
```

## Queries and Mutations

Queries follow a consistent pattern of list (with pagination/filtering) and single-item lookups. Mutations handle create, update, and delete operations with input validation.

## Exploring the Schema

Use the Apollo Studio Explorer or any GraphQL client to browse the full schema at `http://localhost:4000/graphql`.
