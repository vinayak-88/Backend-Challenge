const dotenv = require('dotenv');
const { createContainer } = require('./container');
const { createApp } = require('./app');

dotenv.config();

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be set before starting the server.');
}

const JWT_SECRET = process.env.JWT_SECRET;
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const container = createContainer({ jwtSecret: JWT_SECRET });
const app = createApp(container);

async function bootstrap() {
  await container.prisma.$connect();
  app.listen(PORT, () => {
    console.log(`GraphQL API listening on http://localhost:${PORT}/graphql`);
  });
}

bootstrap();

async function shutdown() {
  await container.prisma.$disconnect();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
