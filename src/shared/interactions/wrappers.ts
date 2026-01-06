import { type ChatInputCommandInteraction } from 'discord.js';
import { logger } from '../logging/logger';
import type { Command, Services } from './commandRouter';

export async function wrapCommand(
  command: Command,
  interaction: ChatInputCommandInteraction,
  services: Services
) {
  try {
    await command.execute(interaction, services);
  } catch (error) {
    logger.error(
      {
        error,
        commandName: command.name,
        userId: interaction.user.id,
        guildId: interaction.guildId,
      },
      'Command execution error'
    );

    const errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred';

    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: `❌ Error: ${errorMessage}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `❌ Error: ${errorMessage}`,
          ephemeral: true,
        });
      }
    } catch (replyError) {
      logger.error({ error: replyError }, 'Failed to send error message');
    }
  }
}

