import { type Client, type GuildMember, Events } from 'discord.js';
import { logger } from '../../../shared/logging/logger';
import { LogWriter } from '../services/logWriter';
import { FeatureFlagService } from '../../../shared/config/featureFlagService';

export function setupGuildMemberRemoveEvent(
  client: Client,
  logWriter: LogWriter,
  featureFlagService: FeatureFlagService
) {
  client.on(Events.GuildMemberRemove, async (member: GuildMember | { user: { tag: string; id: string }; guild: { id: string } }) => {
    try {
      // Safety check - member might be partial
      if (!member?.guild?.id || !member?.user) {
        logger.warn('Received invalid GuildMemberRemove event');
        return;
      }

      const isLoggingEnabled = await featureFlagService.isEnabled(member.guild.id, 'LOGGING');
      if (!isLoggingEnabled) {
        return;
      }

      const leftTimestamp = Math.floor(Date.now() / 1000);
      const content = `👋 **Member Left**\n**User:** ${member.user.tag} (${member.user.id})\n**Left:** <t:${leftTimestamp}:F>`;

      await logWriter.writeToLogChannel(member.guild.id, content);
    } catch (error) {
      logger.error(
        { error, guildId: member?.guild?.id, userId: member?.user?.id },
        'Failed to handle guildMemberRemove'
      );
    }
  });
}

