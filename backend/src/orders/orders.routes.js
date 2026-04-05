const express = require('express');
const { asyncHandler } = require('../common/utils/async-handler');
const { requireRoles } = require('../common/middleware/require-roles');
const { Role } = require('../common/enums/role.enum');

function createOrdersRouter(ordersController, authenticate) {
  const router = express.Router();

  router.use(authenticate);
  router.get('/orders', asyncHandler(ordersController.listOrders.bind(ordersController)));
  
  router.post(
    '/orders/:orderId/checkout',
    requireRoles(Role.ADMIN, Role.MANAGER, Role.MEMBER),
    asyncHandler(ordersController.checkoutOrder.bind(ordersController)),
  );
  router.patch(
    '/orders/:orderId/payment-method',
    requireRoles(Role.ADMIN),
    asyncHandler(ordersController.updateOrderPaymentMethod.bind(ordersController)),
  );
  router.post(
    '/orders/:orderId/cancel',
    requireRoles(Role.ADMIN, Role.MANAGER, Role.MEMBER),
    asyncHandler(ordersController.cancelOrder.bind(ordersController)),
  );

  return router;
}

module.exports = {
  createOrdersRouter,
};
