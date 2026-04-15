# Project Context

Last updated: 2026-04-03

## Project Goal
- Full-stack food ordering app for the Slooze take-home.
- Final stack:
  - Backend: Express + GraphQL + Prisma
  - Database: PostgreSQL on Neon
  - Frontend: React + Vite
- Assignment requirements covered:
  - view restaurants/menu items
  - create order/add food items
  - checkout/pay using existing payment method
  - cancel order
  - modify payment method
  - RBAC by role
  - bonus country-limited access for managers/members

## Monorepo Structure
- Root contains `backend` and `frontend`.
- Backend layering:
  - Bootstrap: `backend/src/main.js`
  - App wiring: `backend/src/app.js`
  - DI container: `backend/src/container.js`
  - GraphQL transport:
    - `backend/src/graphql/router.js`
    - `backend/src/graphql/schema.js`
  - Service modules:
    - `backend/src/auth`
    - `backend/src/users`
    - `backend/src/restaurants`
    - `backend/src/payments`
    - `backend/src/orders`
  - Shared components:
    - `backend/src/common/access.service.js`
    - `backend/src/common/middleware/error-handler.js`
    - `backend/src/common/http-error.js`

## Authorization Model
- Authoritative enforcement is resolver-level RBAC.
- Role permissions:
  - View restaurants/menu items: ADMIN, MANAGER, MEMBER
  - Create order/cart: ADMIN, MANAGER, MEMBER
  - Checkout: ADMIN, MANAGER
  - Cancel order: ADMIN, MANAGER
  - Update payment method: ADMIN
- GraphQL policy is enforced in `backend/src/graphql/schema.js`.
- Country scoping in `backend/src/common/access.service.js`:
  - ADMIN bypasses country limits
  - MANAGER can act on same-country data/orders
  - MEMBER is limited to own same-country orders and cannot access `users`; use `me` instead.
- JWT auth re-fetches the user from DB on every request in `backend/src/auth/auth.service.js`, so role changes apply immediately.

## Cart and Order Behavior
- Cart is backend-persisted (no longer frontend-only).
- `cart` returns the user active `DRAFT` order.
- `saveCart` stores the user active cart as a draft order.
- Draft cart persists across logout/login.
- Draft orders cannot be cancelled via `cancelOrder`.
  Use `saveCart` with empty `items` to clear the cart instead.
- Frontend cart sync is in `frontend/src/App.jsx`.
- Orders are created as DRAFT in `backend/src/orders/orders.service.js`.
- Checkout, payment update, and cancel enforce ownership/country checks.

## Database and Prisma
- Prisma schema: `backend/prisma/schema.prisma`
- Database: Neon PostgreSQL using `DATABASE_URL` and `DIRECT_URL`
- Seed script: `backend/prisma/seed.js`
- Seed data is deterministic, including fixed payment method `last4`.

## Seeded Users
- Nick Fury: ADMIN
- Captain Marvel: MANAGER, INDIA
- Captain America: MANAGER, AMERICA
- Thanos: MEMBER, INDIA
- Thor: MEMBER, INDIA
- Travis: MEMBER, AMERICA
- Shared seeded password: `Password123!`

## Frontend
- Main screen: `frontend/src/App.jsx`
- API helper: `frontend/src/lib/api.js`
- UI currently supports:
  - login/logout
  - restaurant/menu browsing
  - cart editing
  - backend cart persistence
  - draft/placed/cancelled order viewing
  - checkout/cancel/update payment actions by role

## Safety and Validation
- `JWT_SECRET` is required on startup in `backend/src/main.js`.
- Known HTTP errors are forwarded safely; unknown errors return generic `Internal server error.` in `backend/src/common/middleware/error-handler.js`.
- Payment-method ownership is validated on cart save and order creation in `backend/src/orders/orders.service.js`.
- Safe user responses are controlled by Prisma select allowlists in `backend/src/users/user.selects.js`.
- Login flow includes note about missing production rate limiting.

## GraphQL Operations
- `query health`
- `query me`
- `query users`
- `query restaurants`
- `query payments`
- `query cart`
- `query orders`
- `mutation login`
- `mutation saveCart`
- `mutation checkoutOrder`
- `mutation updateOrderPaymentMethod`
- `mutation cancelOrder`

## Verification Completed
- Backend syntax checks passed repeatedly.
- Frontend build passed.
- Prisma/Neon schema connectivity validated.
- Seed executed successfully against Neon.
- Live API checks passed for:
  - login
  - RBAC enforcement
  - country scoping
  - manager/member/admin access differences
  - persisted backend cart across relogin
  - cross-user payment-method rejection
  - admin-only payment updates

## Cleanup and Current State
- Removed old SQLite file `assignment.db`.
- Removed dead `action.enum.js` after RBAC moved to routes.
- `.env` remains present; real Neon credentials should not be submitted.

## Remaining Caveats
- No automated app test suite yet.
- Request validation is basic (not schema-library-level).
- Login rate limiting is noted but not implemented.
