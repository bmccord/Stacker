import { gql } from '@apollo/client';

// ── Auth ──────────────────────────────────────────────────────────────────

export const SIGN_IN = gql`
  mutation SignIn($email: String!, $password: String!) {
    signIn(email: $email, password: $password) {
      token
      user { id email firstName lastName emailVerified }
    }
  }
`;

export const CHANGE_PASSWORD = gql`
  mutation ChangePassword($currentPassword: String!, $newPassword: String!) {
    changePassword(currentPassword: $currentPassword, newPassword: $newPassword)
  }
`;

export const REQUEST_PASSWORD_RESET = gql`
  mutation RequestPasswordReset($email: String!) {
    requestPasswordReset(email: $email)
  }
`;

export const RESET_PASSWORD = gql`
  mutation ResetPassword($token: String!, $password: String!) {
    resetPassword(token: $token, password: $password) {
      token
      user { id email firstName lastName emailVerified }
    }
  }
`;

export const GET_ME = gql`
  query GetMe { me { id email firstName lastName emailVerified } }
`;

// ── Books ─────────────────────────────────────────────────────────────────

export const GET_BOOKS = gql`
  query GetBooks($genre: String) {
    books(genre: $genre) {
      id title authorId genre description coverUrl averageRating reviewCount createdAt
      author { id name }
    }
  }
`;

export const GET_BOOK = gql`
  query GetBook($id: String!) {
    book(id: $id) {
      id title authorId genre description coverUrl averageRating reviewCount createdAt
      author { id name bio }
    }
  }
`;

export const UPSERT_BOOK = gql`
  mutation UpsertBook($input: UpsertBookInput!) {
    upsertBook(input: $input) { id title }
  }
`;

export const DELETE_BOOK = gql`
  mutation DeleteBook($id: String!) { deleteBook(id: $id) }
`;

// ── Authors ───────────────────────────────────────────────────────────────

export const GET_AUTHORS = gql`
  query GetAuthors {
    authors { id name bio bookCount createdAt }
  }
`;

export const GET_AUTHOR = gql`
  query GetAuthor($id: String!) {
    author(id: $id) { id name bio bookCount createdAt }
  }
`;

export const UPSERT_AUTHOR = gql`
  mutation UpsertAuthor($input: UpsertAuthorInput!) {
    upsertAuthor(input: $input) { id name }
  }
`;

export const DELETE_AUTHOR = gql`
  mutation DeleteAuthor($id: String!) { deleteAuthor(id: $id) }
`;

// ── Reviews ───────────────────────────────────────────────────────────────

export const GET_BOOK_REVIEWS = gql`
  query GetBookReviews($bookId: String!) {
    bookReviews(bookId: $bookId) { id bookId userId userName rating text createdAt }
  }
`;

export const UPSERT_REVIEW = gql`
  mutation UpsertReview($input: UpsertReviewInput!) {
    upsertReview(input: $input) { id rating text }
  }
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($id: String!) { deleteReview(id: $id) }
`;

// ── Dashboard ─────────────────────────────────────────────────────────────

export const GET_DASHBOARD_STATS = gql`
  query GetDashboardStats {
    dashboardStats { bookCount authorCount reviewCount userCount }
  }
`;

// ── Users (admin) ─────────────────────────────────────────────────────────

export const GET_USERS = gql`
  query GetUsers {
    users {
      id email firstName lastName emailVerified createdAt
      groups { id name slug isSystem }
    }
  }
`;

export const INVITE_USER = gql`
  mutation InviteUser($email: String!, $groupIds: [String!]!) {
    inviteUser(email: $email, groupIds: $groupIds)
  }
`;

export const UPDATE_USER_GROUPS = gql`
  mutation UpdateUserGroups($userId: String!, $groupIds: [String!]!) {
    updateUserGroups(userId: $userId, groupIds: $groupIds) {
      id email groups { id name slug isSystem }
    }
  }
`;

export const REMOVE_USER = gql`
  mutation RemoveUser($userId: String!) { removeUser(userId: $userId) }
`;

// ── Groups (admin) ────────────────────────────────────────────────────────

export const GET_GROUPS = gql`
  query GetGroups {
    groups { id name slug description isSystem permissions memberCount }
  }
`;

export const GET_GROUP = gql`
  query GetGroup($id: String!) {
    group(id: $id) { id name slug description isSystem permissions memberCount }
  }
`;

export const GET_ALL_PERMISSIONS = gql`
  query GetAllPermissions {
    allPermissions { label permissions { id label } }
  }
`;

export const CREATE_GROUP = gql`
  mutation CreateGroup($input: CreateGroupInput!) {
    createGroup(input: $input) { id name slug }
  }
`;

export const UPDATE_GROUP = gql`
  mutation UpdateGroup($input: UpdateGroupInput!) {
    updateGroup(input: $input) { id name slug permissions }
  }
`;

export const DELETE_GROUP = gql`
  mutation DeleteGroup($id: String!) { deleteGroup(id: $id) }
`;

// ── API Version ───────────────────────────────────────────────────────────

export const GET_API_VERSION = gql`
  query GetApiVersion { apiVersion }
`;
