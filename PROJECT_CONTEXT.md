# Project Context

Last updated: 2026-04-03

## Project Goal
- Full-stack food ordering app for the Slooze take-home.
- Final stack:
  - Backend: Express + REST + Prisma
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
  - Feature modules:
    - `backend/src/auth`
    - `backend/src/users`
    - `backend/src/restaurants`
    - `backend/src/payments`
    - `backend/src/cart`
    - `backend/src/orders`
    - `backend/src/health`
  - Shared components:
    - `backend/src/common/access.service.js`
    - `backend/src/common/middleware/require-roles.js`
    - `backend/src/common/middleware/authenticate.js`
    - `backend/src/common/middleware/error-handler.js`
    - `backend/src/common/http-error.js`

## Authorization Model
- Authoritative enforcement is route-level RBAC.
- Role permissions:
  - View restaurants/menu items: ADMIN, MANAGER, MEMBER
  - Create order/cart: ADMIN, MANAGER, MEMBER
  - Checkout: ADMIN, MANAGER
  - Cancel order: ADMIN, MANAGER
  - Update payment method: ADMIN
- Route policy is visible in route files such as:
  - `backend/src/orders/orders.routes.js`
  - `backend/src/payments/payments.routes.js`
- Country scoping in `backend/src/common/access.service.js`:
  - ADMIN bypasses country limits
  - MANAGER can act on same-country data/orders
  - MEMBER is limited to own same-country orders
- JWT auth re-fetches the user from DB on every request in `backend/src/auth/auth.service.js`, so role changes apply immediately.

## Cart and Order Behavior
- Cart is backend-persisted (no longer frontend-only).
- `GET /api/cart` returns the user active DRAFT order.
- `PUT /api/cart` stores the user active cart as draft order.
- Draft cart persists across logout/login.
- Frontend cart sync is in `frontend/src/AppView.jsx`.
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
- Main screen: `frontend/src/AppView.jsx`
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
- Required field validation helper: `backend/src/common/utils/require-body-fields.js`.
- Payment-method ownership is validated on cart save and order creation in `backend/src/orders/orders.service.js`.
- Safe user responses are controlled by Prisma select allowlists in `backend/src/users/user.selects.js`.
- Login route includes note about missing production rate limiting in `backend/src/auth/auth.routes.js`.

## API Endpoints
- POST /api/auth/login
- GET /api/health
- GET /api/users/me
- GET /api/users
- GET /api/restaurants
- GET /api/payments
- POST /api/payments
- GET /api/cart
- PUT /api/cart
- GET /api/orders
- POST /api/orders
- POST /api/orders/:orderId/checkout
- PATCH /api/orders/:orderId/payment-method
- POST /api/orders/:orderId/cancel

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
- `backend/src/common/utils/sanitize-user.js` appears obsolete after select-based safe responses and may be unused.
