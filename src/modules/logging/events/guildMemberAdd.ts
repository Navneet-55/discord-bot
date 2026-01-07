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
      const isLoggingEnabled = await featureFlagService.isEnabled(member.guild.id, 'LOGGING');
      if (!isLoggingEnabled) {
        return;
      }

      const content = `👤 **Member Joined**\n**User:** ${member.user.tag} (${member.user.id})\n**Account Created:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:F>\n**Joined:** <t:${Math.floor(Date.now() / 1000)}:F>`;

      await logWriter.writeToLogChannel(member.guild.id, content);
    } catch (error) {
      logger.error({ error, guildId: member.guild.id, userId: member.user.id }, 'Failed to handle guildMemberAdd');
    }
  });
}

