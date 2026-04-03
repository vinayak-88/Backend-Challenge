const express = require('express');
const cors = require('cors');
const { createAuthenticateMiddleware } = require('./common/middleware/authenticate');
const { errorHandler } = require('./common/middleware/error-handler');
const { createHealthRouter } = require('./health/health.routes');
const { createAuthRouter } = require('./auth/auth.routes');
const { createUsersRouter } = require('./users/users.routes');
const { createRestaurantsRouter } = require('./restaurants/restaurants.routes');
const { createPaymentsRouter } = require('./payments/payments.routes');
const { createCartRouter } = require('./cart/cart.routes');
const { createOrdersRouter } = require('./orders/orders.routes');

function createApp({ controllers, services }) {
  const app = express();
  const authenticate = createAuthenticateMiddleware(services.authService);

  app.use(
  cors({
    origin: [process.env.CORS_ORIGIN || 'http://localhost:5173'],
    credentials: true,
  }),
);
  app.use(express.json());

  app.use('/api', createHealthRouter(controllers.healthController));
  app.use('/api', createAuthRouter(controllers.authController));
  app.use('/api', createUsersRouter(controllers.usersController, authenticate));
  app.use('/api', createRestaurantsRouter(controllers.restaurantsController, authenticate));
  app.use('/api', createPaymentsRouter(controllers.paymentsController, authenticate));
  app.use('/api', createCartRouter(controllers.cartController, authenticate));
  app.use('/api', createOrdersRouter(controllers.ordersController, authenticate));

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
