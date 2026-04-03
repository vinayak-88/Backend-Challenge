const { PrismaClient } = require('@prisma/client');
const { AccessService } = require('./common/access.service');
const { UsersService } = require('./users/users.service');
const { RestaurantsService } = require('./restaurants/restaurants.service');
const { OrdersService } = require('./orders/orders.service');
const { PaymentsService } = require('./payments/payments.service');
const { AuthService } = require('./auth/auth.service');
const { HealthController } = require('./health/health.controller');
const { AuthController } = require('./auth/auth.controller');
const { UsersController } = require('./users/users.controller');
const { RestaurantsController } = require('./restaurants/restaurants.controller');
const { PaymentsController } = require('./payments/payments.controller');
const { OrdersController } = require('./orders/orders.controller');
const { CartController } = require('./cart/cart.controller');

function createContainer({ jwtSecret }) {
  const prisma = new PrismaClient();

  const accessService = new AccessService();
  const usersService = new UsersService(prisma);
  const restaurantsService = new RestaurantsService(prisma);
  const ordersService = new OrdersService(prisma, accessService);
  const paymentsService = new PaymentsService(prisma);
  const authService = new AuthService(usersService, jwtSecret);

  return {
    prisma,
    controllers: {
      healthController: new HealthController(),
      authController: new AuthController(authService),
      usersController: new UsersController(usersService),
      restaurantsController: new RestaurantsController(restaurantsService),
      paymentsController: new PaymentsController(paymentsService),
      ordersController: new OrdersController(ordersService),
      cartController: new CartController(ordersService),
    },
    services: {
      accessService,
      usersService,
      restaurantsService,
      ordersService,
      paymentsService,
      authService,
    },
  };
}

module.exports = {
  createContainer,
};
