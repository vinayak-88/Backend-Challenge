const { requireBodyFields } = require('../common/utils/require-body-fields');

class CartController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  async getCart(req, res) {
    const cart = await this.ordersService.getCart(req.user);
    res.json(cart);
  }

  async saveCart(req, res) {
    requireBodyFields(req.body, ['restaurantId', 'items']);

    const cart = await this.ordersService.saveCart(req.user, req.body);
    res.json(cart);
  }
}

module.exports = {
  CartController,
};
