import { type TextChannel, type Client } from 'discord.js';
import { logger } from '../../../shared/logging/logger';
import { GuildConfigService } from '../../../shared/config/guildConfigService';
import { FeatureFlagService } from '../../../shared/config/featureFlagService';

export class LogWriter {
  constructor(
    private client: Client,
    private guildConfigService: GuildConfigService,
    private featureFlagService: FeatureFlagService
  ) {}

  async writeToLogChannel(guildId: string, content: string): Promise<boolean> {
    if (!guildId || !content) {
      return false;
    }

    try {
      const isLoggingEnabled = await this.featureFlagService.isEnabled(guildId, 'LOGGING');
      if (!isLoggingEnabled) {
        return false;
      }

      const config = await this.guildConfigService.getConfig(guildId);
      if (!config?.logChannelId) {
        return false;
      }

      const channel = await this.client.channels.fetch(config.logChannelId);
      if (!channel || !channel.isTextBased()) {
        logger.warn({ guildId, channelId: config.logChannelId }, 'Log channel not found or invalid');
        return false;
      }

      // Discord message limit is 2000 characters
      const messageContent = content.length > 2000 ? `${content.substring(0, 1997)}...` : content;
      await (channel as TextChannel).send(messageContent);
      return true;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to write to log channel');
      return false;
    }
  }

  async writeToModLogChannel(guildId: string, content: string): Promise<boolean> {
    try {
      const isModerationEnabled = await this.featureFlagService.isEnabled(
        guildId,
        'MODERATION'
      );
      if (!isModerationEnabled) {
        return false;
      }

      const config = await this.guildConfigService.getConfig(guildId);
      if (!config?.modLogChannelId) {
        return false;
      }

      const channel = await this.client.channels.fetch(config.modLogChannelId);
      if (!channel || !channel.isTextBased()) {
        return false;
      }

      await (channel as TextChannel).send(content);
      return true;
    } catch (error) {
      logger.error({ error, guildId }, 'Failed to write to mod log channel');
      return false;
    }
  }
}

