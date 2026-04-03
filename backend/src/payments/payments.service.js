const { createHttpError } = require('../common/http-error');

const VALID_PAYMENT_TYPES = ['VISA', 'MASTERCARD'];

class PaymentsService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  listForUser(user) {
    return this.prisma.paymentMethod.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async upsert(user, input) {
    if (!VALID_PAYMENT_TYPES.includes(input.type)) {
      throw createHttpError(400, 'Invalid payment type.');
    }

    if (typeof input.last4 !== 'string' || !/^\d{4}$/.test(input.last4)) {
      throw createHttpError(400, 'last4 must be exactly 4 digits.');
    }

    if (typeof input.isDefault !== 'boolean') {
      throw createHttpError(400, 'isDefault must be a boolean.');
    }

    if (input.id) {
      const existing = await this.prisma.paymentMethod.findFirst({
        where: {
          id: input.id,
          userId: user.id,
        },
      });

      if (!existing) {
        throw createHttpError(404, 'Payment method not found.');
      }
    }

    return this.prisma.$transaction(async (tx) => {
      if (input.isDefault) {
        await tx.paymentMethod.updateMany({
          where: { userId: user.id },
          data: { isDefault: false },
        });
      }

      if (input.id) {
        return tx.paymentMethod.update({
          where: { id: input.id },
          data: {
            type: input.type,
            last4: input.last4,
            isDefault: input.isDefault,
          },
        });
      }

      return tx.paymentMethod.create({
        data: {
          type: input.type,
          last4: input.last4,
          isDefault: input.isDefault,
          userId: user.id,
        },
      });
    });
  }
}

module.exports = {
  PaymentsService,
};
