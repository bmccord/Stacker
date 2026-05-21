export const typeDefs = `#graphql
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

  type Author {
    id: String!
    name: String!
    bio: String
    bookCount: Int!
    createdAt: String!
  }

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

  type Review {
    id: String!
    bookId: String!
    userId: String!
    userName: String
    rating: Int!
    text: String
    createdAt: String!
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

  type PermissionCategory {
    label: String!
    permissions: [PermissionItem!]!
  }

  type PermissionItem {
    id: String!
    label: String!
  }

  type DashboardStats {
    bookCount: Int!
    authorCount: Int!
    reviewCount: Int!
    userCount: Int!
  }

  # ── Inputs ──────────────────────────────────────────────────────────────

  input UpsertAuthorInput {
    id: String
    name: String!
    bio: String
  }

  input UpsertBookInput {
    id: String
    title: String!
    authorId: String!
    genre: String
    description: String
    coverUrl: String
  }

  input UpsertReviewInput {
    id: String
    bookId: String!
    rating: Int!
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

  # ── Queries ─────────────────────────────────────────────────────────────

  type Query {
    # Public
    books(genre: String): [Book!]!
    book(id: String!): Book
    authors: [Author!]!
    author(id: String!): Author
    bookReviews(bookId: String!): [Review!]!

    # Authenticated
    me: User
    dashboardStats: DashboardStats!
    allPermissions: [PermissionCategory!]!

    # Admin (users.manage)
    users: [AppUser!]!
    groups: [Group!]!
    group(id: String!): Group

    # API version
    apiVersion: String!
  }

  # ── Mutations ───────────────────────────────────────────────────────────

  type Mutation {
    # Auth (public)
    signIn(email: String!, password: String!): AuthPayload!
    requestPasswordReset(email: String!): Boolean!
    resetPassword(token: String!, password: String!): AuthPayload!

    # Auth (authenticated)
    changePassword(currentPassword: String!, newPassword: String!): Boolean!

    # Books (books.manage)
    upsertBook(input: UpsertBookInput!): Book!
    deleteBook(id: String!): Boolean!

    # Authors (authors.manage)
    upsertAuthor(input: UpsertAuthorInput!): Author!
    deleteAuthor(id: String!): Boolean!

    # Reviews (reviews.manage)
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
  }
`;
