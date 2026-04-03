const express = require('express');
const { asyncHandler } = require('../common/utils/async-handler');
const { requireRoles } = require('../common/middleware/require-roles');
const { Role } = require('../common/enums/role.enum');

function createPaymentsRouter(paymentsController, authenticate) {
  const router = express.Router();

  router.use(authenticate);
  router.get('/payments', asyncHandler(paymentsController.listPaymentMethods.bind(paymentsController)));
  router.post(
    '/payments',
    requireRoles(Role.ADMIN),
    asyncHandler(paymentsController.upsertPaymentMethod.bind(paymentsController)),
  );

  return router;
}

module.exports = {
  createPaymentsRouter,
};
