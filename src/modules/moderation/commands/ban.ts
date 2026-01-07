import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  type GuildMember,
} from 'discord.js';
import { checkModeratorPermissions, checkCanModerate } from '../../../shared/permissions/checks';
import { prisma } from '../../../shared/db/prisma';
import { getNextCaseNumber } from '../../../shared/utils/caseNumber';
import type { Command } from '../../../shared/interactions/commandRouter';

export const ban: Command = {
  name: 'ban',
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Ban a user from the server')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to ban').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the ban')
    )
    .addIntegerOption((option) =>
      option
        .setName('delete_days')
        .setDescription('Days of messages to delete (0-7)')
        .setMinValue(0)
        .setMaxValue(7)
    ),
  async execute(interaction, services) {
    if (!interaction.guildId || !interaction.member) {
      await interaction.reply({
        content: 'This command must be used in a guild',
        ephemeral: true,
      });
      return;
    }

    const permCheck = checkModeratorPermissions(interaction);
    if (!permCheck.allowed) {
      await interaction.reply({
        content: permCheck.reason || 'Permission denied',
        ephemeral: true,
      });
      return;
    }

    const targetUser = interaction.options.getUser('user', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const deleteDays = interaction.options.getInteger('delete_days') ?? 0;

    // Check if user is in guild (optional for ban)
    let targetMember: GuildMember | null = null;
    try {
      targetMember = await interaction.guild.members.fetch(targetUser.id);
    } catch {
      // User not in guild, can still ban
    }

    if (targetMember) {
      const canModerate = checkCanModerate(
        interaction.member as GuildMember,
        targetMember
      );
      if (!canModerate.allowed) {
        await interaction.reply({
          content: canModerate.reason || 'Cannot moderate this user',
          ephemeral: true,
        });
        return;
      }
    }

    try {
      await interaction.guild.members.ban(targetUser.id, {
        reason,
        deleteMessageDays: deleteDays,
      });
    } catch (error) {
      services.logger.error({ error, userId: targetUser.id }, 'Failed to ban user');
      await interaction.reply({
        content: 'Failed to ban user. Check bot permissions.',
        ephemeral: true,
      });
      return;
    }

    const caseNumber = await getNextCaseNumber(interaction.guildId);

    await prisma.modCase.create({
      data: {
        guildId: interaction.guildId,
        caseNumber,
        userId: targetUser.id,
        moderatorId: interaction.user.id,
        type: 'BAN',
        reason,
        metadata: { deleteDays },
      },
    });

    // Best-effort mod log (non-blocking)
    if (interaction.guildId) {
      services.logWriter
        .writeToModLogChannel(
          interaction.guildId,
          `🔨 **Ban** | Case #${caseNumber}\n**User:** ${targetUser.tag} (${targetUser.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}\n**Delete Days:** ${deleteDays}`
        )
        .catch((error) => {
          services.logger.error({ error, guildId: interaction.guildId }, 'Failed to write mod log');
        });
    }

    await interaction.reply({
      content: `🔨 Banned ${targetUser} (Case #${caseNumber})\n**Reason:** ${reason}\n**Delete Days:** ${deleteDays}`,
    });
  },
  featureKey: 'MODERATION',
};

