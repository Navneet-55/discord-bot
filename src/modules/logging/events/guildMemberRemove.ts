import { type Client, type GuildMember, Events } from 'discord.js';
import { logger } from '../../../shared/logging/logger';
import { LogWriter } from '../services/logWriter';
import { FeatureFlagService } from '../../../shared/config/featureFlagService';

export function setupGuildMemberRemoveEvent(
  client: Client,
  logWriter: LogWriter,
  featureFlagService: FeatureFlagService
) {
  client.on(Events.GuildMemberRemove, async (member: GuildMember) => {
    try {
      const isLoggingEnabled = await featureFlagService.isEnabled(member.guild.id, 'LOGGING');
      if (!isLoggingEnabled) {
        return;
      }

      const content = `👋 **Member Left**\n**User:** ${member.user.tag} (${member.user.id})\n**Left:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logWriter.writeToLogChannel(member.guild.id, content);
    } catch (error) {
      logger.error({ error, guildId: member.guild.id, userId: member.user.id }, 'Failed to handle guildMemberRemove');
    }
  });
}

