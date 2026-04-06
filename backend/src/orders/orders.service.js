const { createHttpError } = require("../common/http-error");
const { OrderStatus } = require("../common/enums/order-status.enum");
const { Role } = require("../common/enums/role.enum");
const { paymentMethodsRelationSelect } = require("../users/user.selects");

const orderUserInclude = {
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    country: true,
    paymentMethods: paymentMethodsRelationSelect,
  },
};

const orderInclude = {
  restaurant: true,
  paymentMethod: true,
  user: orderUserInclude,
  items: {
    include: {
      menuItem: true,
    },
  },
};

const cartSelect = {
  id: true,
  status: true,
  total: true,
  restaurantId: true,
  items: {
    select: {
      menuItemId: true,
      quantity: true,
      unitPrice: true,
      menuItem: {
        select: {
          name: true,
        },
      },
    },
  },
};

const baseWhere = {
  status: { not: OrderStatus.DRAFT }, // add this
};

class OrdersService {
  constructor(prisma, accessService) {
    this.prisma = prisma;
    this.accessService = accessService;
  }

  findCurrentCart(userId, select = null) {
    return this.prisma.order.findFirst({
      where: {
        userId,
        status: OrderStatus.DRAFT,
      },
      ...(select ? { select } : { include: orderInclude }),
      orderBy: [{ updatedAt: "desc" }, { createdAt: "desc" }],
    });
  }

  async getCart(user) {
    return this.findCurrentCart(user.id, cartSelect);
  }

  listMine(user) {
    const where =
      user.role === Role.ADMIN
        ? baseWhere
        : user.role === Role.MANAGER
          ? {
              ...baseWhere,
              restaurant: {
                country: user.country ?? undefined,
              },
            }
          : {
              ...baseWhere,
              userId: user.id,
              restaurant: {
                country: user.country ?? undefined,
              },
            };

    return this.prisma.order.findMany({
      where,
      include: orderInclude,
      orderBy: { createdAt: "desc" },
    });
  }

  async saveCart(user, input) {
    const restaurant = await this.prisma.restaurant.findUnique({
      where: { id: input.restaurantId },
      include: { menuItems: true },
    });

    if (!restaurant) {
      throw createHttpError(404, "Restaurant not found.");
    }

    this.accessService.ensureCountryScope(user, restaurant.country);

    const menuItemsById = new Map(
      restaurant.menuItems.map((item) => [item.id, item]),
    );
    const normalizedItems = input.items ?? [];

    const orderItems = normalizedItems.map((item) => {
      const menuItem = menuItemsById.get(item.menuItemId);

      if (!menuItem) {
        throw createHttpError(
          400,
          "One or more menu items do not belong to this restaurant.",
        );
      }

      if (!Number.isInteger(item.quantity) || item.quantity < 1) {
        throw createHttpError(400, "Item quantity must be a positive integer.");
      }

      return {
        menuItemId: menuItem.id,
        quantity: item.quantity,
        unitPrice: menuItem.price,
      };
    });

    let paymentMethodId = input.paymentMethodId ?? null;

    if (paymentMethodId) {
      const paymentMethod = await this.prisma.paymentMethod.findFirst({
        where: {
          id: paymentMethodId,
          userId: user.id,
        },
      });

      if (!paymentMethod) {
        throw createHttpError(404, "Payment method not found.");
      }
    }

    const existingCart = await this.findCurrentCart(user.id);

    if (orderItems.length === 0) {
      if (existingCart) {
        await this.prisma.order.delete({
          where: { id: existingCart.id },
        });
      }

      return null;
    }

    const total = orderItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    if (!paymentMethodId) {
      paymentMethodId = existingCart?.paymentMethodId ?? null;
    }

    if (!existingCart) {
      return this.prisma.order.create({
        data: {
          userId: user.id,
          restaurantId: restaurant.id,
          paymentMethodId,
          total,
          status: OrderStatus.DRAFT,
          items: {
            create: orderItems,
          },
        },
        select: cartSelect,
      });
    }

    await this.prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: existingCart.id },
        data: {
          restaurantId: restaurant.id,
          paymentMethodId,
          total,
        },
      });

      await tx.orderItem.deleteMany({
        where: { orderId: existingCart.id },
      });

      await tx.orderItem.createMany({
        data: orderItems.map((item) => ({
          ...item,
          orderId: existingCart.id,
        })),
      });
    });

    return this.prisma.order.findUnique({
      where: { id: existingCart.id },
      select: cartSelect,
    });
  }

  async checkout(user, orderId, paymentMethodId) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        items: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
      throw createHttpError(404, "Order not found.");
    }

    this.accessService.canManageOrder(
      user,
      order.userId,
      order.restaurant.country,
    );

    if (order.status !== OrderStatus.DRAFT) {
      throw createHttpError(400, "Only draft orders can be checked out.");
    }

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: {
        id: paymentMethodId,
        userId: order.user.id,
      },
    });

    if (!paymentMethod) {
      throw createHttpError(404, "Payment method not found.");
    }

    if (order.items.length === 0) {
      throw createHttpError(400, "Cannot checkout an empty order.");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: {
        paymentMethodId: paymentMethod.id,
        status: OrderStatus.PLACED,
      },
      include: orderInclude,
    });
  }

  async updatePaymentMethod(user, orderId, paymentMethodId) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        user: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!order) {
      throw createHttpError(404, "Order not found.");
    }

    this.accessService.canManageOrder(
      user,
      order.userId,
      order.restaurant.country,
    );

    if (order.status !== OrderStatus.DRAFT) {
      throw createHttpError(
        400,
        "Payment method can only be updated for draft orders.",
      );
    }

    const paymentMethod = await this.prisma.paymentMethod.findFirst({
      where: { id: paymentMethodId, userId: order.user.id },
    });

    if (!paymentMethod) {
      throw createHttpError(404, "Payment method not found.");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { paymentMethodId },
      include: orderInclude,
    });
  }

  async cancel(user, orderId) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        restaurant: true,
        user: orderUserInclude,
      },
    });

    if (!order) {
      throw createHttpError(404, "Order not found.");
    }

    this.accessService.canManageOrder(
      user,
      order.userId,
      order.restaurant.country,
    );

    if (order.status === OrderStatus.CANCELLED) {
      throw createHttpError(400, "Order is already cancelled.");
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status: OrderStatus.CANCELLED },
      include: orderInclude,
    });
  }
}

module.exports = {
  OrdersService,
};
