import { SlashCommandBuilder } from 'discord.js';
import { checkAdminPermissions } from '../../../shared/permissions/checks';
import type { FeatureKey } from '../../../shared/config/featureFlagService';
import type { Command } from '../../../shared/interactions/commandRouter';

const FEATURE_CHOICES: { name: string; value: FeatureKey }[] = [
  { name: 'Core', value: 'CORE' },
  { name: 'Moderation', value: 'MODERATION' },
  { name: 'Logging', value: 'LOGGING' },
];

export const feature: Command = {
  name: 'feature',
  data: new SlashCommandBuilder()
    .setName('feature')
    .setDescription('Manage feature flags')
    .addSubcommand((subcommand) =>
      subcommand.setName('list').setDescription('List all feature flags')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('enable')
        .setDescription('Enable a feature')
        .addStringOption((option) =>
          option
            .setName('feature')
            .setDescription('Feature to enable')
            .setRequired(true)
            .addChoices(...FEATURE_CHOICES)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('disable')
        .setDescription('Disable a feature')
        .addStringOption((option) =>
          option
            .setName('feature')
            .setDescription('Feature to disable')
            .setRequired(true)
            .addChoices(...FEATURE_CHOICES)
        )
    ),
  async execute(interaction, services) {
    if (!interaction.guildId) {
      await interaction.reply({
        content: 'This command must be used in a guild',
        ephemeral: true,
      });
      return;
    }

    const adminCheck = checkAdminPermissions(interaction);
    if (!adminCheck.allowed) {
      await interaction.reply({
        content: adminCheck.reason || 'Permission denied',
        ephemeral: true,
      });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'list') {
      const flags = await services.featureFlagService.listFlags(interaction.guildId);

      const parts: string[] = ['**Feature Flags:**'];
      for (const flag of flags) {
        const status = flag.enabled ? '✅' : '❌';
        parts.push(`${status} **${flag.featureKey}:** ${flag.enabled ? 'Enabled' : 'Disabled'}`);
      }

      await interaction.reply({
        content: parts.join('\n'),
        ephemeral: true,
      });
    } else if (subcommand === 'enable') {
      const featureKey = interaction.options.getString('feature', true) as FeatureKey;

      try {
        await services.featureFlagService.setEnabled(interaction.guildId, featureKey, true);
        await interaction.reply({
          content: `✅ Feature **${featureKey}** has been enabled`,
          ephemeral: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to enable feature';
        await interaction.reply({
          content: `❌ ${message}`,
          ephemeral: true,
        });
      }
    } else if (subcommand === 'disable') {
      const featureKey = interaction.options.getString('feature', true) as FeatureKey;

      try {
        await services.featureFlagService.setEnabled(interaction.guildId, featureKey, false);
        await interaction.reply({
          content: `❌ Feature **${featureKey}** has been disabled`,
          ephemeral: true,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to disable feature';
        await interaction.reply({
          content: `❌ ${message}`,
          ephemeral: true,
        });
      }
    }
  },
  featureKey: 'CORE',
};
