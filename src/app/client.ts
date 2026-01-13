import { Client, GatewayIntentBits } from 'discord.js';
import { getEnv } from '../shared/config/env';
import { logger } from '../shared/logging/logger';

export async function createClient(): Promise<Client> {
  const env = getEnv();
  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMembers,
      GatewayIntentBits.GuildModeration,
    ],
  });

  client.once('ready', (readyClient: Client<true>) => {
    logger.info(
      {
        userId: readyClient.user.id,
        username: readyClient.user.tag,
        guildCount: readyClient.guilds.cache.size,
      },
      'Bot is ready and connected'
    );
  });

  client.on('error', (error: Error) => {
    logger.error({ error }, 'Discord client error');
  });

  client.on('warn', (warning: string) => {
    logger.warn({ warning }, 'Discord client warning');
  });

  client.on('disconnect', () => {
    logger.warn('Discord client disconnected');
  });

  client.on('reconnecting', () => {
    logger.info('Discord client reconnecting...');
  });

  await client.login(env.DISCORD_TOKEN);

  return client;
}
