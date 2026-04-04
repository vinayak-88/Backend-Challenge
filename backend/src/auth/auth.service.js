const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { createHttpError } = require('../common/http-error');

function parseBearerToken(headerValue) {
  if (!headerValue || !headerValue.startsWith('Bearer ')) {
    return null;
  }

  return headerValue.slice('Bearer '.length).trim();
}

class AuthService {
  constructor(usersService, jwtSecret) {
    this.usersService = usersService;
    this.jwtSecret = jwtSecret;
  }

  async login(email, password) {
    const user = await this.usersService.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw createHttpError(401, 'Invalid email or password.');
    }

    const accessToken = jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
        country: user.country,
      },
      this.jwtSecret,
      { expiresIn: '1d' },
    );

    return {
      accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        country: user.country,
        paymentMethods: (user.paymentMethods ?? []).map((paymentMethod) => ({
          id: paymentMethod.id,
          type: paymentMethod.type,
          last4: paymentMethod.last4,
          isDefault: paymentMethod.isDefault,
        })),
      },
    };
  }

  async authenticateRequest(authorizationHeader) {
    const token = parseBearerToken(authorizationHeader);

    if (!token) {
      throw createHttpError(401, 'Authentication token is required.');
    }

    const payload = jwt.verify(token, this.jwtSecret);
    const user = await this.usersService.findById(payload.sub);

    if (!user) {
      throw createHttpError(401, 'Invalid authentication token.');
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      country: user.country,
    };
  }
}

module.exports = {
  AuthService,
};
