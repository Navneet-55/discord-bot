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
    const errorDetails = {
      error,
      commandName: command.name,
      userId: interaction.user.id,
      guildId: interaction.guildId,
      channelId: interaction.channelId,
    };

    logger.error(errorDetails, 'Command execution error');

    // Don't expose internal error details to users in production
    const isDevelopment = process.env.NODE_ENV === 'development';
    const errorMessage =
      error instanceof Error
        ? isDevelopment
          ? error.message
          : 'An unexpected error occurred. Please try again later.'
        : 'An unexpected error occurred. Please try again later.';

    try {
      // Check if interaction is still valid
      if (interaction.ephemeral === undefined && !interaction.isRepliable()) {
        logger.warn({ commandName: command.name }, 'Interaction is no longer repliable');
        return;
      }

      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: `❌ ${errorMessage}`,
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: `❌ ${errorMessage}`,
          ephemeral: true,
        });
      }
    } catch (replyError) {
      logger.error(
        { error: replyError, originalError: error, commandName: command.name },
        'Failed to send error message to user'
      );
    }
  }
}

