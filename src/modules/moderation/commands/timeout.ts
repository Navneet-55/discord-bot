import { SlashCommandBuilder, type GuildMember } from 'discord.js';
import { checkModeratorPermissions, checkCanModerate } from '../../../shared/permissions/checks';
import { parseDuration } from '../../../shared/utils/duration';
import { prisma } from '../../../shared/db/prisma';
import { getNextCaseNumber } from '../../../shared/utils/caseNumber';
import type { Command } from '../../../shared/interactions/commandRouter';

export const timeout: Command = {
  name: 'timeout',
  data: new SlashCommandBuilder()
    .setName('timeout')
    .setDescription('Timeout a user')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to timeout').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('duration').setDescription('Duration (e.g., 10m, 2h, 1d)').setRequired(true)
    )
    .addStringOption((option) => option.setName('reason').setDescription('Reason for the timeout')),
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
    const durationInput = interaction.options.getString('duration', true);
    const reason = interaction.options.getString('reason') || 'No reason provided';

    const durationResult = parseDuration(durationInput);
    if (!durationResult.success) {
      await interaction.reply({
        content: `❌ ${durationResult.error}`,
        ephemeral: true,
      });
      return;
    }

    const targetMember = await interaction.guild!.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      await interaction.reply({
        content: 'User not found in this guild',
        ephemeral: true,
      });
      return;
    }

    const canModerate = checkCanModerate(interaction.member as GuildMember, targetMember);
    if (!canModerate.allowed) {
      await interaction.reply({
        content: canModerate.reason || 'Cannot moderate this user',
        ephemeral: true,
      });
      return;
    }

    try {
      await targetMember.timeout(durationResult.milliseconds!, reason);
    } catch (error) {
      services.logger.error({ error, userId: targetUser.id }, 'Failed to timeout user');
      await interaction.reply({
        content: 'Failed to timeout user. Check bot permissions.',
        ephemeral: true,
      });
      return;
    }

    let caseNumber: number;
    try {
      caseNumber = await getNextCaseNumber(interaction.guildId);

      await prisma.modCase.create({
        data: {
          guildId: interaction.guildId,
          caseNumber,
          userId: targetUser.id,
          moderatorId: interaction.user.id,
          type: 'TIMEOUT',
          reason,
          metadata: { durationMs: durationResult.milliseconds, durationInput },
        },
      });
    } catch (error) {
      services.logger.error({ error, guildId: interaction.guildId }, 'Failed to create mod case');
      await interaction.reply({
        content: 'User was timed out, but failed to create case record. Please check logs.',
        ephemeral: true,
      });
      return;
    }

    // Best-effort mod log (non-blocking)
    if (interaction.guildId) {
      services.logWriter
        .writeToModLogChannel(
          interaction.guildId,
          `⏱️ **Timeout** | Case #${caseNumber}\n**User:** ${targetUser.tag} (${targetUser.id})\n**Moderator:** ${interaction.user.tag}\n**Duration:** ${durationInput}\n**Reason:** ${reason}`
        )
        .catch((error) => {
          services.logger.error({ error, guildId: interaction.guildId }, 'Failed to write mod log');
        });
    }

    await interaction.reply({
      content: `⏱️ Timed out ${targetUser} for ${durationInput} (Case #${caseNumber})\n**Reason:** ${reason}`,
    });
  },
  featureKey: 'MODERATION',
};
