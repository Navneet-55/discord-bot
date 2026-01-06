import {
  type ChatInputCommandInteraction,
  type SlashCommandBuilder,
  type SlashCommandSubcommandsOnlyBuilder,
} from 'discord.js';
import { FeatureFlagService, type FeatureKey } from '../config/featureFlagService';
import { GuildConfigService } from '../config/guildConfigService';
import { logger } from '../logging/logger';
import { prisma } from '../db/prisma';
import { wrapCommand } from './wrappers';

export interface Services {
  prisma: typeof prisma;
  logger: typeof logger;
  guildConfigService: GuildConfigService;
  featureFlagService: FeatureFlagService;
}

export interface Command {
  name: string;
  data: SlashCommandBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup'>;
  execute: (interaction: ChatInputCommandInteraction, services: Services) => Promise<void>;
  featureKey?: FeatureKey;
}

export class CommandRouter {
  private commands = new Map<string, Command>();
  private services: Services;

  constructor(services: Services) {
    this.services = services;
  }

  register(command: Command) {
    this.commands.set(command.name, command);
  }

  async handle(interaction: ChatInputCommandInteraction) {
    const command = this.commands.get(interaction.commandName);

    if (!command) {
      logger.warn({ commandName: interaction.commandName }, 'Unknown command');
      await interaction.reply({
        content: 'Unknown command',
        ephemeral: true,
      });
      return;
    }

    // Feature gating
    if (command.featureKey) {
      const guildId = interaction.guildId;
      if (!guildId) {
        await interaction.reply({
          content: 'This command must be used in a guild',
          ephemeral: true,
        });
        return;
      }

      const isEnabled = await this.services.featureFlagService.isEnabled(
        guildId,
        command.featureKey
      );

      if (!isEnabled) {
        await interaction.reply({
          content: `Feature "${command.featureKey}" is disabled. Use \`/feature enable feature:${command.featureKey}\` to enable it.`,
          ephemeral: true,
        });
        return;
      }
    }

    // Execute with wrapper
    await wrapCommand(command, interaction, this.services);
  }

  getAllCommands(): Command[] {
    return Array.from(this.commands.values());
  }
}

