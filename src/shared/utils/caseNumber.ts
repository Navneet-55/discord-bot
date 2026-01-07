import { prisma } from '../db/prisma';
import { logger } from '../logging/logger';

export async function getNextCaseNumber(guildId: string): Promise<number> {
  if (!guildId || typeof guildId !== 'string') {
    throw new Error('Invalid guildId provided');
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const maxCase = await tx.modCase.findFirst({
        where: { guildId },
        orderBy: { caseNumber: 'desc' },
        select: { caseNumber: true },
      });

      const nextNumber = (maxCase?.caseNumber ?? 0) + 1;
      logger.debug({ guildId, nextCaseNumber: nextNumber }, 'Generated next case number');
      return nextNumber;
    });
  } catch (error) {
    logger.error({ error, guildId }, 'Failed to get next case number');
    throw error;
  }
}

