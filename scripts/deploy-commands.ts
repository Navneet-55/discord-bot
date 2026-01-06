import { registerCommands } from '../src/app/registerCommands';
import { coreModule } from '../src/modules/core';
import { moderationModule } from '../src/modules/moderation';
import { logger } from '../src/shared/logging/logger';

async function deploy() {
  try {
    const allCommands = [...coreModule, ...moderationModule];
    await registerCommands(allCommands);
    logger.info('Commands deployed successfully');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Failed to deploy commands');
    process.exit(1);
  }
}

deploy();

