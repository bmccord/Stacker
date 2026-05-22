---
slug: /
sidebar_position: 1
---

# Stacker

Stacker is a production-ready GraphQL + React starter kit built with modern TypeScript. It provides a complete foundation for building full-stack web applications with authentication, authorization, CRUD operations, and developer tooling out of the box.

## The Monorepo

The codebase is a monorepo with four projects:

| Project | What it is |
|---------|-----------|
| **stacker-api** | Node.js/TypeScript GraphQL API (Apollo Server 4, Express 4, Prisma 7, MariaDB) |
| **stacker-ui** | React/Vite web app (React Router v7, Apollo Client, shadcn/ui, Tailwind, React Hook Form) |
| **stacker-cli** | TypeScript CLI for data export and seed generation (Commander) |
| **stacker-docs** | This documentation site (Docusaurus) |

Each project has its own `package.json` and is versioned independently. The CI/CD pipeline only builds and deploys projects that have changed.

## Example App: Bookshelf

The starter kit includes a fully functional bookshelf/library application demonstrating all the patterns:

- **Books** with authors, genres, descriptions, and cover images
- **Reviews** with star ratings (1-5) and text
- **Authors** with bios and book counts
- **Users** with invitation workflow and email verification
- **Permission groups** with granular, customizable access control
- **Dashboard** with aggregate statistics

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite 8, TypeScript 6, Tailwind CSS, shadcn/ui |
| State/Data | Apollo Client 4, React Hook Form |
| Backend | Node.js 24, Express 4, Apollo Server 4, TypeScript 6 |
| ORM | Prisma 7 with MariaDB driver adapter |
| Database | MariaDB 11 |
| Auth | Custom JWT (HS256 via jose, bcrypt passwords, API key for CLI) |
| Testing | Vitest (unit + integration), Playwright (E2E) |
| CI/CD | GitHub Actions, Docker, GHCR |
| DX | Doppler (optional), Husky git hooks, structured logging (pino) |

## Key DX Features

- **One-command setup** — `yarn init-env` generates all secrets and `.env` files, with or without Doppler
- **Pre-commit hooks** — TypeScript type checking and ESLint on every commit
- **Pre-push hooks** — Prevents pushing to branches with merged PRs
- **Structured logging** — Pino with file rotation and queryable logs via GraphQL
- **Integration test infrastructure** — Docker-based test database with role presets and seed factories
- **Port conflict handling** — Automatically kills orphaned processes on startup
- **Graceful shutdown** — Clean process termination with timeout

## Repository

[github.com/bmccord/Stacker](https://github.com/bmccord/Stacker)
