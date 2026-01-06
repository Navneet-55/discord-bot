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

  client.once('ready', () => {
    logger.info({ userId: client.user?.id }, 'Bot is ready');
  });

  client.on('error', (error) => {
    logger.error({ error }, 'Discord client error');
  });

  await client.login(env.DISCORD_TOKEN);

  return client;
}

