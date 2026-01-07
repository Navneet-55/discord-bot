import 'dotenv/config';
import { registerCommands } from '../src/app/registerCommands';
import { coreModule } from '../src/modules/core';
import { moderationModule } from '../src/modules/moderation';
import { logger } from '../src/shared/logging/logger';

async function deploy() {
  try {
    logger.info('Starting command deployment...');
    const allCommands = [...coreModule, ...moderationModule];
    logger.info({ commandCount: allCommands.length }, 'Deploying commands');
    await registerCommands(allCommands);
    logger.info('Commands deployed successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to deploy commands');
    process.exit(1);
  }
}

deploy();

