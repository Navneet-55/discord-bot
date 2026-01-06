import { prisma } from '../db/prisma';
import { logger } from '../logging/logger';

export type FeatureKey = 'CORE' | 'MODERATION' | 'LOGGING';

export class FeatureFlagService {
  async isEnabled(guildId: string, featureKey: FeatureKey): Promise<boolean> {
    // CORE is always enabled
    if (featureKey === 'CORE') {
      return true;
    }

    try {
      const flag = await prisma.featureFlag.findUnique({
        where: {
          guildId_featureKey: {
            guildId,
            featureKey,
          },
        },
      });

      // Default to enabled if not set
      return flag?.enabled ?? true;
    } catch (error) {
      logger.error({ error, guildId, featureKey }, 'Failed to check feature flag');
      // Default to enabled on error
      return true;
    }
  }

  async setEnabled(guildId: string, featureKey: FeatureKey, enabled: boolean) {
    // Prevent disabling CORE
    if (featureKey === 'CORE' && !enabled) {
      throw new Error('Cannot disable CORE feature');
    }

    try {
      return await prisma.featureFlag.upsert({
        where: {
          guildId_featureKey: {
            guildId,
            featureKey,
          },
        },
        update: {
          enabled,
          updatedAt: new Date(),
        },
        create: {
          guildId,
          featureKey,
          enabled,
        },
      });
    } catch (error) {
      logger.error({ error, guildId, featureKey, enabled }, 'Failed to set feature flag');
      throw error;
    }
  }

  async listFlags(guildId: string) {
    try {
      const flags = await prisma.featureFlag.findMany({
        where: { guildId },
      });

      // Ensure CORE is always present
      const coreFlag = flags.find((f) => f.featureKey === 'CORE');
      if (!coreFlag) {
        return [
          { featureKey: 'CORE' as FeatureKey, enabled: true },
          ...flags.map((f) => ({ featureKey: f.featureKey as FeatureKey, enabled: f.enabled })),
        ];
      }

      return flags.map((f) => ({
        featureKey: f.featureKey as FeatureKey,
        enabled: f.enabled,
      }));
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to list feature flags');
      throw error;
    }
  }
}

