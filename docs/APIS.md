# API Reference

Base URL: http://localhost:4000/api

## Authentication

- Auth mechanism: Bearer token (JWT)
- Login endpoint returns accessToken
- Pass Authorization header for protected endpoints:
  - Authorization: Bearer <accessToken>

## Endpoint List

### Public

- GET /health
- POST /auth/login

### Protected

- GET /users/me
- GET /users
- GET /restaurants
- GET /payments
- POST /payments
- GET /cart
- PUT /cart
- GET /orders
- POST /orders
- POST /orders/:orderId/checkout
- PATCH /orders/:orderId/payment-method
- POST /orders/:orderId/cancel

## Request Shapes

### POST /auth/login

Body:

{
  "email": "nick@slooze.xyz",
  "password": "Password123!"
}

### POST /payments

Body:

{
  "type": "VISA",
  "last4": "9876",
  "isDefault": true
}

### PUT /cart

Body:

{
  "restaurantId": "<restaurantId>",
  "paymentMethodId": "<paymentMethodId>",
  "items": [
    {
      "menuItemId": "<menuItemId>",
      "quantity": 2
    }
  ]
}

### POST /orders

Body:

{
  "restaurantId": "<restaurantId>",
  "paymentMethodId": "<paymentMethodId>",
  "items": [
    {
      "menuItemId": "<menuItemId>",
      "quantity": 1
    }
  ]
}

### POST /orders/:orderId/checkout

Body:

{
  "paymentMethodId": "<paymentMethodId>"
}

### PATCH /orders/:orderId/payment-method

Body:

{
  "paymentMethodId": "<paymentMethodId>"
}

## RBAC Matrix

- View restaurants/menu: ADMIN, MANAGER, MEMBER
- Create order/cart: ADMIN, MANAGER, MEMBER
- Checkout order: ADMIN, MANAGER
- Cancel order: ADMIN, MANAGER
- Update payment method: ADMIN

## Country-Scoped Access

- ADMIN can access all countries.
- MANAGER is scoped to same-country data/actions.
- MEMBER is scoped to own and same-country data/actions.

## Typical Call Sequence

1. POST /auth/login
2. GET /users/me
3. GET /restaurants
4. GET /payments
5. PUT /cart
6. GET /orders
7. POST /orders/:orderId/checkout (role permitting)
