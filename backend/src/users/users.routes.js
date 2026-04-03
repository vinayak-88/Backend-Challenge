const express = require('express');
const { asyncHandler } = require('../common/utils/async-handler');

function createUsersRouter(usersController, authenticate) {
  const router = express.Router();

  router.use(authenticate);
  router.get('/users/me', asyncHandler(usersController.getMe.bind(usersController)));
  router.get('/users', asyncHandler(usersController.listUsers.bind(usersController)));

  return router;
}

module.exports = {
  createUsersRouter,
};
