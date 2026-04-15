# Slooze Take Home Assignment

This repository contains a full-stack food ordering application that implements:

- Express GraphQL backend with Prisma
- PostgreSQL persistence (Neon-ready)
- React + Vite frontend
- JWT authentication
- RBAC and country-scoped access controls

## Submission Resources

The following resources are included to help reviewers run and understand the system:

- Legacy Postman artifacts: [postman/Slooze-Backend-Challenge.postman_collection.json](postman/Slooze-Backend-Challenge.postman_collection.json)
- Legacy Postman environment: [postman/Slooze-Backend-Challenge.postman_environment.json](postman/Slooze-Backend-Challenge.postman_environment.json)
- Dataset documentation: [docs/DATASETS.md](docs/DATASETS.md)
- Architecture and design: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)
- API reference and access model: [docs/APIS.md](docs/APIS.md)

## Tech Stack

- Backend: Express, GraphQL, Prisma Client, PostgreSQL
- Frontend: React, Vite
- Auth: JWT
- Access Control: Role-based route guards + country-scoped data checks

## Local Setup

### 1. Prerequisites

- Node.js 18+
- npm 9+
- PostgreSQL (either Neon or local Docker)

### 2. Install dependencies

```bash
npm install
```

### 3. Configure backend environment

Copy [backend/.env.example](backend/.env.example) to backend/.env.

Required values:

- DATABASE_URL
- DIRECT_URL
- JWT_SECRET
- PORT (default 4000)

Neon example:

```text
DATABASE_URL=postgresql://USER:PASSWORD@YOUR-ENDPOINT-pooler.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require
DIRECT_URL=postgresql://USER:PASSWORD@YOUR-ENDPOINT.REGION.aws.neon.tech/neondb?sslmode=require&channel_binding=require
JWT_SECRET=super-secret-key
PORT=4000
```

Optional local PostgreSQL using Docker Compose:

```bash
npm --workspace backend run db:up
```

Then use local URLs in backend/.env, for example:

```text
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/slooze_assignment?schema=public
DIRECT_URL=postgresql://postgres:postgres@localhost:5432/slooze_assignment?schema=public
```

### 4. Configure frontend environment

Copy [frontend/.env.example](frontend/.env.example) to frontend/.env.

Default value:

```text
VITE_API_URL=http://localhost:4000/graphql
```

### 5. Prepare database

```bash
npm --workspace backend run prisma:generate
npm --workspace backend run prisma:migrate
npm --workspace backend run seed:direct
```

### 6. Start the application

In terminal 1:

```bash
npm run dev:backend
```

In terminal 2:

```bash
npm run dev:frontend
```

URLs:

- Backend API: https://backend-production-2da9.up.railway.app/graphql
- Frontend UI: https://frontend-production-925d3.up.railway.app

## Demo Accounts

All seeded users share the password below:

```text
Password123!
```

Users:

- nick@slooze.xyz (ADMIN)
- captain.marvel@slooze.xyz (MANAGER, INDIA)
- captain.america@slooze.xyz (MANAGER, AMERICA)
- thanos@slooze.xyz (MEMBER, INDIA)
- thor@slooze.xyz (MEMBER, INDIA)
- travis@slooze.xyz (MEMBER, AMERICA)

## What is Implemented

- Restaurant and menu browsing
- Draft cart persistence in backend
- Order creation with menu items
- Checkout using existing payment method
- Order cancellation
- Payment method update workflow (admin-only)
- Route-level RBAC enforcement
- Country-limited access for manager/member roles

## Scripts

Root scripts:

- npm run dev:backend
- npm run dev:frontend
- npm run build
- npm run seed

Backend scripts:

- npm --workspace backend run start:dev
- npm --workspace backend run prisma:generate
- npm --workspace backend run prisma:migrate
- npm --workspace backend run seed:direct
- npm --workspace backend run db:up
- npm --workspace backend run db:down

Frontend scripts:

- npm --workspace frontend run dev
- npm --workspace frontend run build
- npm --workspace frontend run preview

## Reviewer Quick Test

Send GraphQL operations to `POST /graphql`.

1. Run the `login` mutation and capture `accessToken`.
2. Send `Authorization: Bearer <accessToken>` on protected operations.
3. Query `me`, `restaurants`, `payments`, `cart`, and `orders`.
4. Exercise `saveCart`, `checkoutOrder`, `updateOrderPaymentMethod`, and `cancelOrder`.

## Notes

- The checked-in Postman files still reflect the previous REST transport; `docs/APIS.md` is the current GraphQL reference.
- Login flow currently has a TODO note for production rate limiting.
- Request validation is intentionally minimal for this take-home implementation.
- Automated end-to-end test suite is not included yet.
