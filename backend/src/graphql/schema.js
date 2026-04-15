const { buildSchema, GraphQLError } = require('graphql');
const { createHttpError } = require('../common/http-error');
const { Role } = require('../common/enums/role.enum');

function toGraphQLError(error) {
  if (error instanceof GraphQLError) {
    return error;
  }

  if (error?.name === 'JsonWebTokenError' || error?.name === 'TokenExpiredError') {
    return new GraphQLError('Invalid authentication token.', {
      extensions: {
        code: 'UNAUTHENTICATED',
        http: { status: 401 },
      },
    });
  }

  if (error?.isHttpError) {
    const code =
      error.statusCode === 401
        ? 'UNAUTHENTICATED'
        : error.statusCode === 403
          ? 'FORBIDDEN'
          : error.statusCode >= 500
            ? 'INTERNAL_SERVER_ERROR'
            : 'BAD_USER_INPUT';

    return new GraphQLError(error.message, {
      extensions: {
        code,
        http: { status: error.statusCode },
      },
    });
  }

  console.error(error);

  return new GraphQLError('Internal server error.', {
    extensions: {
      code: 'INTERNAL_SERVER_ERROR',
      http: { status: 500 },
    },
  });
}

function withErrorBoundary(handler) {
  return async function resolver(args, context) {
    try {
      return await handler(args, context);
    } catch (error) {
      throw toGraphQLError(error);
    }
  };
}

function requireAuth(context) {
  if (context.authError) {
    throw context.authError;
  }

  if (!context.user) {
    throw createHttpError(401, 'Authentication token is required.');
  }

  return context.user;
}

function requireRoles(context, ...roles) {
  const user = requireAuth(context);

  if (!roles.includes(user.role)) {
    throw createHttpError(403, 'Insufficient permissions.');
  }

  return user;
}

const schema = buildSchema(`
  enum Role {
    ADMIN
    MANAGER
    MEMBER
  }

  enum OrderStatus {
    DRAFT
    PLACED
    CANCELLED
  }

  type HealthStatus {
    ok: Boolean!
  }

  type PaymentMethod {
    id: ID!
    type: String!
    last4: String!
    isDefault: Boolean!
    userId: ID
    createdAt: String
    updatedAt: String
  }

  type User {
    id: ID!
    email: String!
    name: String!
    role: Role!
    country: String
    paymentMethods: [PaymentMethod!]!
  }

  type MenuItem {
    id: ID!
    name: String!
    description: String!
    price: Float!
    restaurantId: ID
    createdAt: String
    updatedAt: String
  }

  type Restaurant {
    id: ID!
    name: String!
    country: String!
    menuItems: [MenuItem!]!
    createdAt: String
    updatedAt: String
  }

  type CartMenuItem {
    name: String
  }

  type CartItem {
    menuItemId: ID!
    quantity: Int!
    unitPrice: Float!
    menuItem: CartMenuItem
  }

  type Cart {
    id: ID!
    status: OrderStatus!
    total: Float!
    restaurantId: ID!
    paymentMethodId: ID
    items: [CartItem!]!
  }

  type OrderMenuItem {
    id: ID!
    name: String!
  }

  type OrderItem {
    id: ID
    quantity: Int!
    unitPrice: Float!
    orderId: ID
    menuItemId: ID!
    menuItem: OrderMenuItem
  }

  type OrderRestaurant {
    id: ID!
    name: String!
    country: String!
  }

  type OrderPaymentMethod {
    type: String!
    last4: String!
  }

  type OrderUser {
    id: ID!
    name: String!
  }

  type Order {
    id: ID!
    status: OrderStatus!
    total: Float!
    userId: ID!
    restaurantId: ID!
    paymentMethodId: ID
    restaurant: OrderRestaurant!
    paymentMethod: OrderPaymentMethod
    user: OrderUser!
    items: [OrderItem!]!
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    accessToken: String!
    user: User!
  }

  input SaveCartItemInput {
    menuItemId: ID!
    quantity: Int!
  }

  input SaveCartInput {
    restaurantId: ID!
    paymentMethodId: ID
    items: [SaveCartItemInput!]!
  }

  type Query {
    health: HealthStatus!
    me: User
    users: [User!]
    restaurants: [Restaurant!]
    payments: [PaymentMethod!]
    cart: Cart
    orders: [Order!]
  }

  type Mutation {
    login(email: String!, password: String!): AuthPayload!
    saveCart(input: SaveCartInput!): Cart
    checkoutOrder(orderId: ID!, paymentMethodId: ID!): Order!
    updateOrderPaymentMethod(orderId: ID!, paymentMethodId: ID!): Order!
    cancelOrder(orderId: ID!): Order!
  }
`);

function createRootValue(services) {
  return {
    health: withErrorBoundary(async () => ({ ok: true })),
    me: withErrorBoundary(async (_args, context) => {
      const user = requireAuth(context);
      return services.usersService.findSafeById(user.id);
    }),
    users: withErrorBoundary(async (_args, context) => {
      const user = requireRoles(context, Role.ADMIN, Role.MANAGER);
      return services.usersService.findAccessibleUsers(user);
    }),
    restaurants: withErrorBoundary(async (_args, context) => {
      const user = requireRoles(context, Role.ADMIN, Role.MANAGER, Role.MEMBER);
      return services.restaurantsService.findAll(user);
    }),
    payments: withErrorBoundary(async (_args, context) => {
      const user = requireAuth(context);
      return services.paymentsService.listForUser(user);
    }),
    cart: withErrorBoundary(async (_args, context) => {
      const user = requireRoles(context, Role.ADMIN, Role.MANAGER, Role.MEMBER);
      return services.ordersService.getCart(user);
    }),
    orders: withErrorBoundary(async (_args, context) => {
      const user = requireAuth(context);
      return services.ordersService.listMine(user);
    }),
    login: withErrorBoundary(async (args) => services.authService.login(args.email, args.password)),
    saveCart: withErrorBoundary(async (args, context) => {
      const user = requireRoles(context, Role.ADMIN, Role.MANAGER, Role.MEMBER);
      return services.ordersService.saveCart(user, args.input);
    }),
    checkoutOrder: withErrorBoundary(async (args, context) => {
      const user = requireRoles(context, Role.ADMIN, Role.MANAGER);
      return services.ordersService.checkout(user, args.orderId, args.paymentMethodId);
    }),
    updateOrderPaymentMethod: withErrorBoundary(async (args, context) => {
      const user = requireRoles(context, Role.ADMIN);
      return services.ordersService.updatePaymentMethod(
        user,
        args.orderId,
        args.paymentMethodId,
      );
    }),
    cancelOrder: withErrorBoundary(async (args, context) => {
      const user = requireRoles(context, Role.ADMIN, Role.MANAGER);
      return services.ordersService.cancel(user, args.orderId);
    }),
  };
}

function createGraphQLContext(req, services) {
  const authorizationHeader = req.headers.authorization;

  if (!authorizationHeader) {
    return { user: null, authError: null, services };
  }

  return services.authService
    .authenticateRequest(authorizationHeader)
    .then((user) => ({ user, authError: null, services }))
    .catch((error) => ({
      user: null,
      authError: toGraphQLError(error),
      services,
    }));
}

module.exports = {
  createGraphQLContext,
  createRootValue,
  schema,
  toGraphQLError,
};
