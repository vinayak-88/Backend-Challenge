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
}

module.exports = {
  PaymentsService,
};
