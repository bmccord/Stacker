---
sidebar_position: 2
---

# Local Setup

Step-by-step guide to getting Stacker running on your local machine.

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/stacker.git
cd stacker
```

## 2. Install Dependencies

```bash
cd stacker-api && yarn install
cd ../stacker-ui && yarn install
```

## 3. Configure Environment

Copy the example environment files and update as needed:

```bash
cp stacker-api/.env.example stacker-api/.env
cp stacker-ui/.env.example stacker-ui/.env
```

## 4. Database Setup

Create the database and run migrations:

```bash
cd stacker-api
yarn prisma migrate dev
yarn prisma db seed
```

## 5. Start Dev Servers

```bash
# Terminal 1 — API (port 4000)
cd stacker-api && yarn dev

# Terminal 2 — UI (port 5173)
cd stacker-ui && yarn dev
```

The API will be available at `http://localhost:4000/graphql` and the UI at `http://localhost:5173`.
