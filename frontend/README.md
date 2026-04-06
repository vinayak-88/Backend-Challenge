# Frontend - Food Ordering Application

## Structure

```
frontend/src/
├── App.jsx                    # Main app component with auth routing
├── main.jsx                   # Entry point
├── styles.css                 # Global styles
├── components/
│   ├── CartPanel.jsx          # Cart management and checkout
│   ├── ErrorBanner.jsx        # Error display component
│   ├── OrderCard.jsx          # Order display with actions
│   ├── OrderList.jsx          # Orders list
│   └── RestaurantMenu.jsx     # Restaurant selection and menu
├── contexts/
│   ├── AuthContext.jsx        # Authentication and RBAC
│   └── DataContext.jsx        # Data fetching and cart state
├── pages/
│   ├── DashboardPage.jsx      # Main dashboard with tabs
│   └── LoginPage.jsx          # Login page
└── services/
    └── api.js                 # API client
```

## API Integration

The frontend integrates with the following backend endpoints:

- `POST /api/auth/login` - Login returns `{ accessToken }`
- `GET /api/users/me` - Returns user with `{ id, name, email, role, country, paymentMethods: [{ id, type, last4, isDefault }] }`
- `GET /api/restaurants` - Returns `[{ id, name, country, menuItems: [{ id, name, description, price }] }]`
- `GET /api/payments` - Returns `[{ id, type, last4, isDefault }]` for current user
- `GET /api/cart` - Returns `{ id, status, total, restaurantId, paymentMethodId, items: [{ menuItemId, quantity, unitPrice, menuItem: { name } }] }` or `null`
- `PUT /api/cart` - Required body: `{ restaurantId, items: [{ menuItemId, quantity }] }`, optional: `{ paymentMethodId }`
- `GET /api/orders` - Returns all non-DRAFT orders with `{ id, status, total, restaurant: { name, country }, user: { name }, paymentMethod: { type, last4 }, items: [{ menuItem: { name }, quantity, unitPrice }] }`
- `POST /api/orders/:id/checkout` - Body: `{ paymentMethodId }`
- `PATCH /api/orders/:id/payment-method` - Body: `{ paymentMethodId }`
- `POST /api/orders/:id/cancel` - No body

## RBAC Matrix

- View restaurants/menu: ADMIN, MANAGER, MEMBER
- Create order/cart: ADMIN, MANAGER, MEMBER
- Checkout: ADMIN, MANAGER
- Cancel order: ADMIN, MANAGER
- Update payment method: ADMIN only

## Country Scoping (Bonus)

- ADMIN: All countries
- MANAGER: Same country only
- MEMBER: Own orders in same country only