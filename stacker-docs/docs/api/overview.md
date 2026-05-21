---
sidebar_position: 1
---

# API Overview

The Stacker API is a GraphQL server built with Apollo Server 4 and Express 4, using Prisma 7 as the ORM with MariaDB.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Server | Apollo Server 4 + Express 4 |
| Language | TypeScript |
| ORM | Prisma 7 |
| Database | MariaDB |
| Auth | JWT (HS256 via `jose`) |

## Key Features

- **GraphQL API** with queries, mutations, and input validation
- **JWT authentication** with bcrypt password hashing
- **Permission-based authorization** with customizable groups
- **Multi-tenancy** via `tenant_id` on every database row
- **Seed data** for rapid development setup
- **Unit and integration tests** with full coverage
