const { Role } = require('../common/enums/role.enum');
const { authUserSelect, safeUserSelect } = require('./user.selects');

class UsersService {
  constructor(prisma) {
    this.prisma = prisma;
  }

  findByEmail(email) {
    return this.prisma.user.findUnique({
      where: { email },
      select: authUserSelect,
    });
  }

  findById(id) {
    return this.prisma.user.findUnique({
      where: { id },
      select: authUserSelect,
    });
  }

  findSafeById(id) {
    return this.prisma.user.findUnique({
      where: { id },
      select: safeUserSelect,
    });
  }

  findAccessibleUsers(viewer) {
    return this.prisma.user.findMany({
      where:
        viewer.role === Role.ADMIN
          ? undefined
          : {
              country: viewer.country ?? undefined,
            },
      select: safeUserSelect,
      orderBy: { name: 'asc' },
    });
  }
}

module.exports = {
  UsersService,
};
