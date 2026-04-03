const { requireBodyFields } = require('../common/utils/require-body-fields');

class OrdersController {
  constructor(ordersService) {
    this.ordersService = ordersService;
  }

  async listOrders(req, res) {
    const orders = await this.ordersService.listMine(req.user);
    res.json(orders);
  }

  async createOrder(req, res) {
    requireBodyFields(req.body, ['restaurantId', 'items']);

    const order = await this.ordersService.create(req.user, req.body);
    res.status(201).json(order);
  }

  async checkoutOrder(req, res) {
    requireBodyFields(req.body, ['paymentMethodId']);

    const order = await this.ordersService.checkout(req.user, req.params.orderId, req.body.paymentMethodId);
    res.json(order);
  }

  async updateOrderPaymentMethod(req, res) {
    requireBodyFields(req.body, ['paymentMethodId']);

    const order = await this.ordersService.updatePaymentMethod(req.user, req.params.orderId, req.body.paymentMethodId);
    res.json(order);
  }

  async cancelOrder(req, res) {
    const order = await this.ordersService.cancel(req.user, req.params.orderId);
    res.json(order);
  }
}

module.exports = {
  OrdersController,
};
