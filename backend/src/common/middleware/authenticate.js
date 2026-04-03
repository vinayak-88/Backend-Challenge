const { createHttpError } = require('../http-error');

function createAuthenticateMiddleware(authService) {
  return async function authenticate(req, _res, next) {
    try {
      const user = await authService.authenticateRequest(req.headers.authorization);
      req.user = user;
      next();
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        next(createHttpError(401, 'Invalid authentication token.'));
        return;
      }

      next(error);
    }
  };
}

module.exports = {
  createAuthenticateMiddleware,
};
