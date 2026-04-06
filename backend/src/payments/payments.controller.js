const { requireBodyFields } = require('../common/utils/require-body-fields');

class PaymentsController {
  constructor(paymentsService) {
    this.paymentsService = paymentsService;
  }

  async listPaymentMethods(req, res) {
    const paymentMethods = await this.paymentsService.listForUser(req.user);
    res.json(paymentMethods);
  }
}

module.exports = {
  PaymentsController,
};
