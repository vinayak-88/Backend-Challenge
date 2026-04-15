const express = require('express');
const { graphql } = require('graphql');
const { createGraphQLContext, createRootValue, schema } = require('./schema');

function deriveStatusCode(result) {
  const statuses = (result.errors ?? [])
    .map((error) => error.extensions?.http?.status)
    .filter(Boolean);

  if (statuses.length === 0) {
    return 200;
  }

  return Math.max(...statuses);
}

function createGraphQLRouter(services) {
  const router = express.Router();
  const rootValue = createRootValue(services);

  router.get('/', (_req, res) => {
    res.json({
      message: 'Send GraphQL operations to this endpoint with POST /graphql.',
    });
  });

  router.post('/', async (req, res, next) => {
    const { query, variables, operationName } = req.body ?? {};

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        errors: [
          {
            message: 'A GraphQL query string is required.',
            extensions: {
              code: 'BAD_REQUEST',
              http: { status: 400 },
            },
          },
        ],
      });
      return;
    }

    try {
      const contextValue = await createGraphQLContext(req, services);
      const result = await graphql({
        schema,
        source: query,
        rootValue,
        contextValue,
        variableValues: variables,
        operationName,
      });

      res.status(deriveStatusCode(result)).json(result);
    } catch (error) {
      next(error);
    }
  });

  return router;
}

module.exports = {
  createGraphQLRouter,
};
