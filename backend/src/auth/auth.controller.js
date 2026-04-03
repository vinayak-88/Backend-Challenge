const { requireBodyFields } = require('../common/utils/require-body-fields');

class AuthController {
  constructor(authService) {
    this.authService = authService;
  }

  async login(req, res) {
    requireBodyFields(req.body, ['email', 'password']);

    const result = await this.authService.login(req.body.email, req.body.password);
    res.json(result);
  }
}

module.exports = {
  AuthController,
};
