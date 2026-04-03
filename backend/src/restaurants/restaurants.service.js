const { Role } = require('../common/enums/role.enum');

class RestaurantsService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  findAll(viewer) {
    return this.prisma.restaurant.findMany({
      where:
        viewer.role === Role.ADMIN
          ? undefined
          : {
              country: viewer.country ?? undefined,
            },
      include: {
        menuItems: {
          orderBy: { name: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = {
  RestaurantsService,
};
