import { PrismaClient } from '@prisma/client';
import { env } from './env';

// Prevent multiple instances in development (hot reload)
declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

const createPrismaClient = (): PrismaClient => {
  return new PrismaClient({
    log: env.isDevelopment() ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
};

export const prisma: PrismaClient =
  global.__prisma ?? createPrismaClient();

if (env.isDevelopment()) {
  global.__prisma = prisma;
}

export default prisma;
