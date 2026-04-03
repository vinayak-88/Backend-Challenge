# Datasets Used

This project uses deterministic seed data defined in backend/prisma/seed.js.

## Seeded Users

Shared password for all users: Password123!

- Nick Fury
  - Email: nick@slooze.xyz
  - Role: ADMIN
  - Country: null (global)
- Captain Marvel
  - Email: captain.marvel@slooze.xyz
  - Role: MANAGER
  - Country: INDIA
- Captain America
  - Email: captain.america@slooze.xyz
  - Role: MANAGER
  - Country: AMERICA
- Thanos
  - Email: thanos@slooze.xyz
  - Role: MEMBER
  - Country: INDIA
- Thor
  - Email: thor@slooze.xyz
  - Role: MEMBER
  - Country: INDIA
- Travis
  - Email: travis@slooze.xyz
  - Role: MEMBER
  - Country: AMERICA

## Seeded Payment Methods

Each seeded user gets two payment methods with deterministic last4 values:

- Nick Fury: 1001, 1002
- Captain Marvel: 2001, 2002
- Captain America: 3001, 3002
- Thanos: 4001, 4002
- Thor: 5001, 5002
- Travis: 6001, 6002

## Seeded Restaurants and Menu Items

### INDIA

- Spice Route
  - Paneer Tikka Wrap (6.50)
  - Masala Fries (3.50)
- Delhi Tandoor
  - Butter Chicken Bowl (8.25)
  - Mango Lassi (2.75)

### AMERICA

- Brooklyn Bites
  - Classic Cheeseburger (9.75)
  - Loaded Tots (4.25)
- Golden State Salads
  - Cobb Salad (10.50)
  - Cold Brew (3.00)

## Data Reset Behavior

Seed script clears and recreates records in this order:

1. OrderItem
2. Order
3. PaymentMethod
4. MenuItem
5. Restaurant
6. User

This ensures idempotent demo setup for reviewers.
