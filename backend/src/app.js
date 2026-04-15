const express = require('express');
const cors = require('cors');
const { errorHandler } = require('./common/middleware/error-handler');
const { createGraphQLRouter } = require('./graphql/router');

function createApp({ services }) {
  const app = express();

  app.use(
    cors({
      origin: [process.env.CORS_ORIGIN || 'http://localhost:5173'],
      credentials: true,
    }),
  );
  app.use(express.json());

  app.use('/graphql', createGraphQLRouter(services));

  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp,
};
