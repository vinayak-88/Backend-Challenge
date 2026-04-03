const client_1 = require("@prisma/client");
const bcrypt = require('bcryptjs');
const { Country } = require('../src/common/enums/country.enum');
const { Role } = require('../src/common/enums/role.enum');
const prisma = new client_1.PrismaClient();
async function seedRestaurants() {
  const restaurants = [
    {
      name: 'Spice Route',
      country: Country.INDIA,
      menuItems: [
        { name: 'Paneer Tikka Wrap', description: 'Smoky paneer, pickled onions, mint chutney.', price: 6.5 },
        { name: 'Masala Fries', description: 'Crispy fries with chaat masala and lime.', price: 3.5 },
      ],
    },
    {
      name: 'Delhi Tandoor',
      country: Country.INDIA,
      menuItems: [
        { name: 'Butter Chicken Bowl', description: 'Creamy butter chicken with jeera rice.', price: 8.25 },
        { name: 'Mango Lassi', description: 'Fresh yogurt smoothie with cardamom.', price: 2.75 },
      ],
    },
    {
      name: 'Brooklyn Bites',
      country: Country.AMERICA,
      menuItems: [
        { name: 'Classic Cheeseburger', description: 'Beef patty, cheddar, lettuce, tomato.', price: 9.75 },
        { name: 'Loaded Tots', description: 'Crispy tots with cheese sauce and scallions.', price: 4.25 },
      ],
    },
    {
      name: 'Golden State Salads',
      country: Country.AMERICA,
      menuItems: [
        { name: 'Cobb Salad', description: 'Chicken, bacon, egg, avocado, blue cheese.', price: 10.5 },
        { name: 'Cold Brew', description: 'Slow-steeped coffee over ice.', price: 3.0 },
      ],
    },
  ];

  for (const restaurant of restaurants) {
    await prisma.restaurant.create({
      data: {
        name: restaurant.name,
        country: restaurant.country,
        menuItems: {
          create: restaurant.menuItems,
        },
      },
    });
  }
}
async function seedUsers() {
  const passwordHash = await bcrypt.hash('Password123!', 10);
  const users = [
    {
      name: 'Nick Fury',
      email: 'nick@slooze.xyz',
      role: Role.ADMIN,
      country: null,
      paymentMethods: [
        { type: 'VISA', last4: '1001', isDefault: true },
        { type: 'MASTERCARD', last4: '1002', isDefault: false },
      ],
    },
    {
      name: 'Captain Marvel',
      email: 'captain.marvel@slooze.xyz',
      role: Role.MANAGER,
      country: Country.INDIA,
      paymentMethods: [
        { type: 'VISA', last4: '2001', isDefault: true },
        { type: 'MASTERCARD', last4: '2002', isDefault: false },
      ],
    },
    {
      name: 'Captain America',
      email: 'captain.america@slooze.xyz',
      role: Role.MANAGER,
      country: Country.AMERICA,
      paymentMethods: [
        { type: 'VISA', last4: '3001', isDefault: true },
        { type: 'MASTERCARD', last4: '3002', isDefault: false },
      ],
    },
    {
      name: 'Thanos',
      email: 'thanos@slooze.xyz',
      role: Role.MEMBER,
      country: Country.INDIA,
      paymentMethods: [
        { type: 'VISA', last4: '4001', isDefault: true },
        { type: 'MASTERCARD', last4: '4002', isDefault: false },
      ],
    },
    {
      name: 'Thor',
      email: 'thor@slooze.xyz',
      role: Role.MEMBER,
      country: Country.INDIA,
      paymentMethods: [
        { type: 'VISA', last4: '5001', isDefault: true },
        { type: 'MASTERCARD', last4: '5002', isDefault: false },
      ],
    },
    {
      name: 'Travis',
      email: 'travis@slooze.xyz',
      role: Role.MEMBER,
      country: Country.AMERICA,
      paymentMethods: [
        { type: 'VISA', last4: '6001', isDefault: true },
        { type: 'MASTERCARD', last4: '6002', isDefault: false },
      ],
    },
  ];

  for (const user of users) {
    await prisma.user.create({
      data: {
        name: user.name,
        email: user.email,
        role: user.role,
        country: user.country,
        passwordHash,
        paymentMethods: {
          create: user.paymentMethods,
        },
      },
    });
  }
}
async function main() {
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();
  await seedRestaurants();
  await seedUsers();
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
