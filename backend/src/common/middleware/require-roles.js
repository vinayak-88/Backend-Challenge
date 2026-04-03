const { createHttpError } = require('../http-error');

function requireRoles(...roles) {
  return function requireRolesMiddleware(req, _res, next) {
    if (!req.user) {
      next(createHttpError(401, 'Authentication token is required.'));
      return;
    }

    if (!roles.includes(req.user.role)) {
      next(createHttpError(403, 'Access denied.'));
      return;
    }

    next();
  };
}

module.exports = {
  requireRoles,
};
