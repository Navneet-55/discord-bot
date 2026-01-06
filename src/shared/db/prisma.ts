import { PrismaClient } from '@prisma/client';
import { logger } from '../logging/logger';

export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' },
  ],
});

prisma.$on('error' as never, (e: unknown) => {
  logger.error(e, 'Prisma error');
});

prisma.$on('warn' as never, (e: unknown) => {
  logger.warn(e, 'Prisma warning');
});

if (process.env.NODE_ENV === 'development') {
  prisma.$on('query' as never, (e: unknown) => {
    logger.debug(e, 'Prisma query');
  });
}

