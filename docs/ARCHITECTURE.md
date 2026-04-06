# Architecture and Design

## Overview

This is a monorepo with two applications:

- backend: Express REST API with Prisma and PostgreSQL
- frontend: React + Vite single-page app

## High-Level Architecture

- Frontend calls backend REST APIs using Bearer JWT authentication.
- Backend authenticates and authorizes each request.
- Backend services apply role and country access checks before data operations.
- Prisma handles persistence to PostgreSQL.

## Backend Design

Backend uses a layered structure:

- Bootstrap: backend/src/main.js
- App wiring: backend/src/app.js
- Dependency container: backend/src/container.js
- Feature modules:
  - auth
  - users
  - restaurants
  - payments
  - cart
  - orders
  - health
- Shared modules:
  - common/access.service.js
  - common/middleware/authenticate.js
  - common/middleware/require-roles.js
  - common/middleware/error-handler.js
  - common/http-error.js

### Request Lifecycle

1. Incoming request hits route handler under /api.
2. authenticate middleware validates JWT and loads current user from DB.
3. require-roles middleware enforces route-level RBAC where configured.
4. Controller validates required fields and delegates to service.
5. Service enforces ownership/country constraints and uses Prisma.
6. Response returns safe data; errors are normalized by error-handler middleware.

## Access Control Design

Two layers are used intentionally:

- Route-level RBAC as the first gate — require-roles middleware enforces which roles can access each endpoint.
- Data-level country and ownership checks as the second gate — 
  access.service.js enforces ensureCountryScope and canManageOrder for country and ownership scoping.

### RBAC Matrix

- View restaurants/menu: ADMIN, MANAGER, MEMBER
- Create order/cart: ADMIN, MANAGER, MEMBER
- Checkout order: ADMIN, MANAGER
- Cancel order: ADMIN, MANAGER
- Update payment method: ADMIN

### Country-Limited Model (Bonus)

- ADMIN: global access.
- MANAGER: limited to same-country data and actions.
- MEMBER: limited to own orders and data only. Cannot access GET /users — use GET /users/me instead.

## Data Model (Prisma)

Core entities:

- User
- Restaurant
- MenuItem
- PaymentMethod
- Order
- OrderItem

Key relations:

- User has many PaymentMethod and Order
- Restaurant has many MenuItem and Order
- Order belongs to User, Restaurant, optional PaymentMethod
- Order has many OrderItem
- OrderItem links an Order and MenuItem with quantity and unitPrice

## Frontend Design

Main UI state lives in frontend/src/AppView.jsx.

Major responsibilities:

- Login/logout session handling
- Fetch dashboard data (me, restaurants, payments, orders, cart)
- Persist cart draft to backend
- Render role-driven actions (checkout/cancel/update payment)
- Handle 401 by auto-logout and re-login prompt

API helper lives in frontend/src/lib/api.js and supports:

- Configurable base URL via VITE_API_URL
- JSON request/response handling
- Explicit unauthorized error signaling for 401 responses

## Error Handling and Security

- JWT_SECRET is required at startup.
- Unknown server errors return a generic message.
- Known HTTP errors return controlled error responses.
- Safe user response payloads are constrained via select allowlists.
- Frontend stores token in sessionStorage to reduce persistence window versus localStorage.

## Operational Notes

- Database seed is deterministic for repeatable demos.
- Backend has no compile step; JavaScript source runs directly.
- Login rate limiting is noted for production hardening.
