import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  ChannelType,
} from 'discord.js';
import { checkAdminPermissions } from '../../../shared/permissions/checks';
import type { Command } from '../../../shared/interactions/commandRouter';

export const config: Command = {
  name: 'config',
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('View or set guild configuration')
    .addSubcommand((subcommand) =>
      subcommand.setName('view').setDescription('View current guild configuration')
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName('set')
        .setDescription('Set guild configuration')
        .addChannelOption((option) =>
          option
            .setName('log_channel')
            .setDescription('Channel for general logging')
            .addChannelTypes(ChannelType.GuildText)
        )
        .addChannelOption((option) =>
          option
            .setName('modlog_channel')
            .setDescription('Channel for moderation logs')
            .addChannelTypes(ChannelType.GuildText)
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

    if (subcommand === 'view') {
      const config = await services.guildConfigService.getConfig(interaction.guildId);

      const parts: string[] = ['**Guild Configuration:**'];
      parts.push(`Log Channel: ${config?.logChannelId ? `<#${config.logChannelId}>` : 'Not set'}`);
      parts.push(
        `Mod Log Channel: ${config?.modLogChannelId ? `<#${config.modLogChannelId}>` : 'Not set'}`
      );

      await interaction.reply({
        content: parts.join('\n'),
        ephemeral: true,
      });
    } else if (subcommand === 'set') {
      const logChannel = interaction.options.getChannel('log_channel');
      const modLogChannel = interaction.options.getChannel('modlog_channel');

      const updateData: {
        logChannelId?: string | null;
        modLogChannelId?: string | null;
      } = {};

      // Check if channels are provided and validate permissions
      if (logChannel) {
        const channel = await interaction.guild.channels.fetch(logChannel.id);
        if (channel && channel.isTextBased()) {
          const botMember = await interaction.guild.members.fetch(interaction.client.user!.id);
          if (!channel.permissionsFor(botMember)?.has(['ViewChannel', 'SendMessages'])) {
            await interaction.reply({
              content: `❌ I don't have permission to send messages in ${logChannel}`,
              ephemeral: true,
            });
            return;
          }
          updateData.logChannelId = logChannel.id;
        }
      }

      if (modLogChannel) {
        const channel = await interaction.guild.channels.fetch(modLogChannel.id);
        if (channel && channel.isTextBased()) {
          const botMember = await interaction.guild.members.fetch(interaction.client.user!.id);
          if (!channel.permissionsFor(botMember)?.has(['ViewChannel', 'SendMessages'])) {
            await interaction.reply({
              content: `❌ I don't have permission to send messages in ${modLogChannel}`,
              ephemeral: true,
            });
            return;
          }
          updateData.modLogChannelId = modLogChannel.id;
        }
      }

      if (Object.keys(updateData).length === 0) {
        await interaction.reply({
          content: 'Please specify at least one channel to update',
          ephemeral: true,
        });
        return;
      }

      try {
        await services.guildConfigService.upsertConfig(interaction.guildId, updateData);

        const parts: string[] = ['✅ **Configuration updated:**'];
        if (updateData.logChannelId !== undefined) {
          parts.push(`Log Channel: <#${updateData.logChannelId}>`);
        }
        if (updateData.modLogChannelId !== undefined) {
          parts.push(`Mod Log Channel: <#${updateData.modLogChannelId}>`);
        }

        await interaction.reply({
          content: parts.join('\n'),
          ephemeral: true,
        });
      } catch (error) {
        services.logger.error({ error, guildId: interaction.guildId }, 'Failed to update config');
        await interaction.reply({
          content: '❌ Failed to update configuration. Please try again.',
          ephemeral: true,
        });
      }
    }
  },
  featureKey: 'CORE',
};

