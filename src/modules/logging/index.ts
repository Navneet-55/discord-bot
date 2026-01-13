import { type Client } from 'discord.js';
import { LogWriter } from './services/logWriter';
import { setupGuildMemberAddEvent } from './events/guildMemberAdd';
import { setupGuildMemberRemoveEvent } from './events/guildMemberRemove';
import { GuildConfigService } from '../../shared/config/guildConfigService';
import { FeatureFlagService } from '../../shared/config/featureFlagService';

export function setupLoggingModule(
  client: Client,
  guildConfigService: GuildConfigService,
  featureFlagService: FeatureFlagService
) {
  const logWriter = new LogWriter(client, guildConfigService, featureFlagService);

  setupGuildMemberAddEvent(client, logWriter, featureFlagService);
  setupGuildMemberRemoveEvent(client, logWriter, featureFlagService);

  return logWriter;
}
