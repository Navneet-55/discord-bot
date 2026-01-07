import 'dotenv/config';
import { Events } from 'discord.js';
import { createClient } from './client';
import { loadModules } from './moduleLoader';
import { registerCommands } from './registerCommands';
import { CommandRouter } from '../shared/interactions/commandRouter';
import { GuildConfigService } from '../shared/config/guildConfigService';
import { FeatureFlagService } from '../shared/config/featureFlagService';
import { LogWriter } from '../modules/logging/services/logWriter';
import { prisma } from '../shared/db/prisma';
import { logger } from '../shared/logging/logger';

async function bootstrap() {
  try {
    logger.info('Starting bot bootstrap...');

    // Create and setup client
    const client = await createClient();

    // Create services
    const guildConfigService = new GuildConfigService();
    const featureFlagService = new FeatureFlagService();
    const logWriter = new LogWriter(client, guildConfigService, featureFlagService);
    const services = {
      prisma,
      logger,
      guildConfigService,
      featureFlagService,
      logWriter,
    };

    // Create command router
    const router = new CommandRouter(services);

    // Load modules (registers commands and events)
    loadModules(client, router, guildConfigService, featureFlagService);

    // Register slash commands
    await registerCommands(router.getAllCommands());

    // Handle interactions
    client.on(Events.InteractionCreate, async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await router.handle(interaction);
      }
    });

    logger.info('Bot bootstrap complete');

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info({ signal }, 'Received shutdown signal');
      try {
        await prisma.$disconnect();
        logger.info('Database disconnected');
        process.exit(0);
      } catch (error) {
        logger.error({ error }, 'Error during shutdown');
        process.exit(1);
      }
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
  } catch (error) {
    logger.error({ error }, 'Bootstrap failed');
    await prisma.$disconnect().catch(() => {});
    process.exit(1);
  }
}

bootstrap();

