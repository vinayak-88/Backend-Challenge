const express = require('express');

function createHealthRouter(healthController) {
  const router = express.Router();

  router.get('/health', healthController.getStatus.bind(healthController));

  return router;
}

module.exports = {
  createHealthRouter,
};
