import { prisma } from '../db/prisma';
import { logger } from '../logging/logger';

export interface GuildConfigData {
  logChannelId?: string | null;
  modLogChannelId?: string | null;
}

export class GuildConfigService {
  async getConfig(guildId: string) {
    try {
      return await prisma.guildConfig.findUnique({
        where: { guildId },
      });
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to get guild config');
      throw error;
    }
  }

  async upsertConfig(guildId: string, data: GuildConfigData) {
    try {
      return await prisma.guildConfig.upsert({
        where: { guildId },
        update: {
          ...data,
          updatedAt: new Date(),
        },
        create: {
          guildId,
          ...data,
        },
      });
    } catch (error) {
      logger.error({ error, guildId, data }, 'Failed to upsert guild config');
      throw error;
    }
  }
}

