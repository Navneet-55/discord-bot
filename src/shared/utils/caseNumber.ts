import { prisma } from '../db/prisma';

export async function getNextCaseNumber(guildId: string): Promise<number> {
  return await prisma.$transaction(async (tx) => {
    const maxCase = await tx.modCase.findFirst({
      where: { guildId },
      orderBy: { caseNumber: 'desc' },
      select: { caseNumber: true },
    });

    return (maxCase?.caseNumber ?? 0) + 1;
  });
}

