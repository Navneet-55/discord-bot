import { type Client, type GuildMember, Events } from 'discord.js';
import { logger } from '../../../shared/logging/logger';
import { LogWriter } from '../services/logWriter';
import { FeatureFlagService } from '../../../shared/config/featureFlagService';

export function setupGuildMemberAddEvent(
  client: Client,
  logWriter: LogWriter,
  featureFlagService: FeatureFlagService
) {
  client.on(Events.GuildMemberAdd, async (member: GuildMember) => {
    try {
      // Safety check
      if (!member?.guild?.id || !member?.user) {
        logger.warn('Received invalid GuildMemberAdd event');
        return;
      }

      const isLoggingEnabled = await featureFlagService.isEnabled(member.guild.id, 'LOGGING');
      if (!isLoggingEnabled) {
        return;
      }

      const accountCreatedTimestamp = Math.floor(member.user.createdTimestamp / 1000);
      const joinedTimestamp = Math.floor(Date.now() / 1000);

      const content = `👤 **Member Joined**\n**User:** ${member.user.tag} (${member.user.id})\n**Account Created:** <t:${accountCreatedTimestamp}:F>\n**Joined:** <t:${joinedTimestamp}:F>`;

      await logWriter.writeToLogChannel(member.guild.id, content);
    } catch (error) {
      logger.error(
        { error, guildId: member?.guild?.id, userId: member?.user?.id },
        'Failed to handle guildMemberAdd'
      );
    }
  });
}
