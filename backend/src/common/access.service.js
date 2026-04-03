const { createHttpError } = require('./http-error');
const { Role } = require('./enums/role.enum');

class AccessService {
  ensureCountryScope(user, country) {
    if (user.role === Role.ADMIN || !country) {
      return;
    }

    if (user.country !== country) {
      throw createHttpError(403, 'Country-scoped access denied.');
    }
  }

  canManageOrder(user, orderUserId, country) {
    if (user.role === Role.ADMIN) {
      return;
    }

    this.ensureCountryScope(user, country);

    if (user.role === Role.MANAGER) {
      return;
    }

    if (user.id !== orderUserId) {
      throw createHttpError(403, 'You can only act on your own country-scoped orders.');
    }
  }
}

module.exports = {
  AccessService,
};
