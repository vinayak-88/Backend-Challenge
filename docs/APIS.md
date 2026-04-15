# API Reference

GraphQL endpoint: `http://localhost:4000/graphql`

## Authentication

- Auth mechanism: Bearer token (JWT)
- `login` returns `accessToken`
- Pass the token on protected operations as `Authorization: Bearer <accessToken>`

## Operations

### Public

- `query health`
- `mutation login(email, password)`

### Protected queries

- `query me`
- `query users` (`ADMIN`, `MANAGER`)
- `query restaurants`
- `query payments`
- `query cart`
- `query orders`

### Protected mutations

- `mutation saveCart(input)` (`ADMIN`, `MANAGER`, `MEMBER`)
- `mutation checkoutOrder(orderId, paymentMethodId)` (`ADMIN`, `MANAGER`)
- `mutation updateOrderPaymentMethod(orderId, paymentMethodId)` (`ADMIN`)
- `mutation cancelOrder(orderId)` (`ADMIN`, `MANAGER`)

## Example Operations

### Login

```graphql
mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
    accessToken
    user {
      id
      email
      name
      role
      country
    }
  }
}
```

Variables:

```json
{
  "email": "nick@slooze.xyz",
  "password": "Password123!"
}
```

### Save cart

```graphql
mutation SaveCart($input: SaveCartInput!) {
  saveCart(input: $input) {
    id
    status
    total
    restaurantId
    paymentMethodId
    items {
      menuItemId
      quantity
      unitPrice
      menuItem {
        name
      }
    }
  }
}
```

Variables:

```json
{
  "input": {
    "restaurantId": "<restaurantId>",
    "paymentMethodId": "<paymentMethodId>",
    "items": [
      {
        "menuItemId": "<menuItemId>",
        "quantity": 2
      }
    ]
  }
}
```

### Checkout order

```graphql
mutation CheckoutOrder($orderId: ID!, $paymentMethodId: ID!) {
  checkoutOrder(orderId: $orderId, paymentMethodId: $paymentMethodId) {
    id
    status
    paymentMethodId
  }
}
```

### Update payment method

```graphql
mutation UpdateOrderPaymentMethod($orderId: ID!, $paymentMethodId: ID!) {
  updateOrderPaymentMethod(orderId: $orderId, paymentMethodId: $paymentMethodId) {
    id
    status
    paymentMethodId
  }
}
```

## RBAC Matrix

- View restaurants/menu: `ADMIN`, `MANAGER`, `MEMBER`
- Create order/cart: `ADMIN`, `MANAGER`, `MEMBER`
- Checkout order: `ADMIN`, `MANAGER`
- Cancel order: `ADMIN`, `MANAGER`
- Update payment method: `ADMIN`

## Country-Scoped Access

- `ADMIN` can access all countries.
- `MANAGER` is scoped to same-country data and actions.
- `MEMBER` is scoped to own and same-country data and actions.

## Typical Call Sequence

1. Run `login`.
2. Run `me`.
3. Run `restaurants`.
4. Run `payments`.
5. Run `saveCart`.
6. Run `orders`.
7. Run `checkoutOrder` when role permits.
