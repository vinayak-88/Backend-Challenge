const express = require('express');
const { asyncHandler } = require('../common/utils/async-handler');
const { requireRoles } = require('../common/middleware/require-roles');
const { Role } = require('../common/enums/role.enum');

function createCartRouter(cartController, authenticate) {
  const router = express.Router();

  router.use(authenticate);
  router.get(
    '/cart',
    requireRoles(Role.ADMIN, Role.MANAGER, Role.MEMBER),
    asyncHandler(cartController.getCart.bind(cartController)),
  );
  router.put(
    '/cart',
    requireRoles(Role.ADMIN, Role.MANAGER, Role.MEMBER),
    asyncHandler(cartController.saveCart.bind(cartController)),
  );

  return router;
}

module.exports = {
  createCartRouter,
};
