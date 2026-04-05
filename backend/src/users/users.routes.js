const express = require('express');
const { asyncHandler } = require('../common/utils/async-handler');
const {requireRoles} = require('../common/middleware/require-roles')
const {Role} = require('../common/enums/role.enum');

function createUsersRouter(usersController, authenticate) {
  const router = express.Router();

  router.use(authenticate);
  router.get('/users/me', asyncHandler(usersController.getMe.bind(usersController)));
  router.get(
    '/users',
    requireRoles(Role.ADMIN, Role.MANAGER),
    asyncHandler(usersController.listUsers.bind(usersController)),
  );

  return router;
}

module.exports = {
  createUsersRouter,
};
