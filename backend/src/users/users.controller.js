class UsersController {
  constructor(usersService) {
    this.usersService = usersService;
  }

  async getMe(req, res) {
    const user = await this.usersService.findSafeById(req.user.id);
    res.json(user);
  }

  async listUsers(req, res) {
    const users = await this.usersService.findAccessibleUsers(req.user);
    res.json(users);
  }
}

module.exports = {
  UsersController,
};
