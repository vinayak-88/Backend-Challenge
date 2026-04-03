const { requireBodyFields } = require('../common/utils/require-body-fields');

class PaymentsController {
  constructor(paymentsService) {
    this.paymentsService = paymentsService;
  }

  async listPaymentMethods(req, res) {
    const paymentMethods = await this.paymentsService.listForUser(req.user);
    res.json(paymentMethods);
  }

  async upsertPaymentMethod(req, res) {
    requireBodyFields(req.body, ['type', 'last4', 'isDefault']);

    const paymentMethod = await this.paymentsService.upsert(req.user, req.body);
    res.status(201).json(paymentMethod);
  }
}

module.exports = {
  PaymentsController,
};
