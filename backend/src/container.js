const { PrismaClient } = require('@prisma/client');
const { AccessService } = require('./common/access.service');
const { UsersService } = require('./users/users.service');
const { RestaurantsService } = require('./restaurants/restaurants.service');
const { OrdersService } = require('./orders/orders.service');
const { PaymentsService } = require('./payments/payments.service');
const { AuthService } = require('./auth/auth.service');

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
