import type { Client } from 'discord.js';
import type { CommandRouter } from '../shared/interactions/commandRouter';
import { coreModule } from '../modules/core';
import { moderationModule } from '../modules/moderation';
import { setupLoggingModule } from '../modules/logging';
import { GuildConfigService } from '../shared/config/guildConfigService';
import { FeatureFlagService } from '../shared/config/featureFlagService';

export function loadModules(
  client: Client,
  router: CommandRouter,
  guildConfigService: GuildConfigService,
  featureFlagService: FeatureFlagService
) {
  // Register core commands
  for (const command of coreModule) {
    router.register(command);
  }

  // Register moderation commands
  for (const command of moderationModule) {
    router.register(command);
  }

  // Setup logging module (events)
  setupLoggingModule(client, guildConfigService, featureFlagService);
}

