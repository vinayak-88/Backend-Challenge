const express = require('express');
const { asyncHandler } = require('../common/utils/async-handler');

function createAuthRouter(authController) {
  const router = express.Router();

  // TODO: add rate limiting (e.g. express-rate-limit) before production deployment.
  router.post('/auth/login', asyncHandler(authController.login.bind(authController)));

  return router;
}

module.exports = {
  createAuthRouter,
};
