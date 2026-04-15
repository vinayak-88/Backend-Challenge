# Architecture and Design

## Overview

This is a monorepo with two applications:

- backend: Express GraphQL API with Prisma and PostgreSQL
- frontend: React + Vite single-page app

## High-Level Architecture

- Frontend calls the backend GraphQL endpoint using Bearer JWT authentication.
- Backend authenticates and authorizes each request.
- Backend services apply role and country access checks before data operations.
- Prisma handles persistence to PostgreSQL.

## Backend Design

Backend uses a layered structure:

- Bootstrap: `backend/src/main.js`
- App wiring: `backend/src/app.js`
- Dependency container: `backend/src/container.js`
- Service modules:
  - auth
  - users
  - restaurants
  - payments
  - orders
- Shared modules:
  - common/access.service.js
  - common/middleware/error-handler.js
  - common/http-error.js

### Request Lifecycle

1. Incoming request hits `POST /graphql`.
2. GraphQL context resolves the current user from the Bearer token when present.
3. Query and mutation resolvers enforce RBAC before invoking services.
4. Services enforce ownership and country constraints and use Prisma.
5. GraphQL returns selected data plus normalized errors.

## Access Control Design

Two layers are used intentionally:

- Resolver-level RBAC as the first gate.
- Data-level country and ownership checks as the second gate via `access.service.js`.

### RBAC Matrix

- View restaurants/menu: ADMIN, MANAGER, MEMBER
- Create order/cart: ADMIN, MANAGER, MEMBER
- Checkout order: ADMIN, MANAGER
- Cancel order: ADMIN, MANAGER
- Update order payment method: ADMIN

### Country-Limited Model

- ADMIN: global access.
- MANAGER: limited to same-country data and actions.
- MEMBER: limited to own same-country orders and data, and cannot access `users`.

## Data Model (Prisma)

Core entities:

- User
- Restaurant
- MenuItem
- PaymentMethod
- Order
- OrderItem

Key relations:

- User has many payment methods and orders
- Restaurant has many menu items and orders
- Order belongs to a user, a restaurant, and an optional payment method
- Order has many order items
- OrderItem links an order and menu item with quantity and unit price

## Frontend Design

Main UI state lives in `frontend/src/App.jsx`.

Major responsibilities:

- Login/logout session handling
- Fetch dashboard data (me, restaurants, payments, orders, cart)
- Persist cart draft to the backend
- Render role-driven actions (checkout/cancel/update payment)
- Handle auth failures by clearing the session and prompting for re-login

API helper lives in `frontend/src/lib/api.js` and supports:

- Configurable base URL via `VITE_API_URL`
- GraphQL request/response handling
- Explicit unauthorized error signaling for auth failures

## Error Handling and Security

- `JWT_SECRET` is required at startup.
- Unknown server errors return a generic message.
- Known service errors are mapped into GraphQL errors with HTTP metadata.
- Safe user response payloads are constrained via Prisma select allowlists.
- Frontend stores token in `sessionStorage` to reduce persistence window versus `localStorage`.

## Operational Notes

- Database seed is deterministic for repeatable demos.
- Backend has no compile step; JavaScript source runs directly.

## Production Hardening Notes

The following items are intentionally out of scope for this take-home assignment but would be addressed before production deployment:

- Token revocation on re-login is not implemented. Old tokens remain valid until their 1-day expiry.
- Login mutation has no rate limiting.
- HTTPS is assumed to be handled by a reverse proxy in production.
