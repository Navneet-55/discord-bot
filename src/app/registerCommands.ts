import { REST, Routes } from 'discord.js';
import { getEnv } from '../shared/config/env';
import { logger } from '../shared/logging/logger';
import type { Command } from '../shared/interactions/commandRouter';

export async function registerCommands(commands: Command[]) {
  const env = getEnv();
  const rest = new REST().setToken(env.DISCORD_TOKEN);

  const commandsData = commands.map((cmd) => cmd.data.toJSON());

  try {
    logger.info({ commandCount: commands.length }, 'Started refreshing application (/) commands.');

    if (env.DISCORD_GUILD_ID) {
      // Guild-scoped deployment (faster)
      await rest.put(Routes.applicationGuildCommands(env.DISCORD_CLIENT_ID, env.DISCORD_GUILD_ID), {
        body: commandsData,
      });
      logger.info(
        { guildId: env.DISCORD_GUILD_ID, commandCount: commands.length },
        'Successfully reloaded guild-scoped application (/) commands.'
      );
    } else {
      // Global deployment
      await rest.put(Routes.applicationCommands(env.DISCORD_CLIENT_ID), {
        body: commandsData,
      });
      logger.info(
        { commandCount: commands.length },
        'Successfully reloaded global application (/) commands.'
      );
      logger.warn('Global commands may take up to 1 hour to propagate.');
    }
  } catch (error) {
    logger.error({ error, commandCount: commands.length }, 'Failed to register commands');
    throw error;
  }
}
