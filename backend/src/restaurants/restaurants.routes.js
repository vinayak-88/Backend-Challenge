const express = require('express');
const { asyncHandler } = require('../common/utils/async-handler');
const { requireRoles } = require('../common/middleware/require-roles');
const { Role } = require('../common/enums/role.enum');

function createRestaurantsRouter(restaurantsController, authenticate) {
  const router = express.Router();

  router.use(authenticate);
  router.get(
    '/restaurants',
    requireRoles(Role.ADMIN, Role.MANAGER, Role.MEMBER),
    asyncHandler(restaurantsController.listRestaurants.bind(restaurantsController)),
  );

  return router;
}

module.exports = {
  createRestaurantsRouter,
};
