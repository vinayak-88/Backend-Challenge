const paymentMethodSummarySelect = {
  id: true,
  type: true,
  last4: true,
  isDefault: true,
};

const paymentMethodsRelationSelect = {
  select: paymentMethodSummarySelect,
  orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
};

const safeUserSelect = {
  id: true,
  email: true,
  name: true,
  role: true,
  country: true,
  paymentMethods: paymentMethodsRelationSelect,
};

const authUserSelect = {
  ...safeUserSelect,
  passwordHash: true,
};

module.exports = {
  authUserSelect,
  paymentMethodSummarySelect,
  paymentMethodsRelationSelect,
  safeUserSelect,
};
