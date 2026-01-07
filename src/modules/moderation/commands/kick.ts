import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  type GuildMember,
} from 'discord.js';
import { checkModeratorPermissions, checkCanModerate } from '../../../shared/permissions/checks';
import { prisma } from '../../../shared/db/prisma';
import { getNextCaseNumber } from '../../../shared/utils/caseNumber';
import type { Command } from '../../../shared/interactions/commandRouter';

export const kick: Command = {
  name: 'kick',
  data: new SlashCommandBuilder()
    .setName('kick')
    .setDescription('Kick a user from the server')
    .addUserOption((option) =>
      option.setName('user').setDescription('User to kick').setRequired(true)
    )
    .addStringOption((option) =>
      option.setName('reason').setDescription('Reason for the kick')
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

    const targetMember = await interaction.guild.members.fetch(targetUser.id).catch(() => null);
    if (!targetMember) {
      await interaction.reply({
        content: 'User not found in this guild',
        ephemeral: true,
      });
      return;
    }

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

    try {
      await targetMember.kick(reason);
    } catch (error) {
      services.logger.error({ error, userId: targetUser.id }, 'Failed to kick user');
      await interaction.reply({
        content: 'Failed to kick user. Check bot permissions.',
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
        type: 'KICK',
        reason,
        metadata: {},
      },
    });

    // Best-effort mod log (non-blocking)
    if (interaction.guildId) {
      services.logWriter
        .writeToModLogChannel(
          interaction.guildId,
          `👢 **Kick** | Case #${caseNumber}\n**User:** ${targetUser.tag} (${targetUser.id})\n**Moderator:** ${interaction.user.tag}\n**Reason:** ${reason}`
        )
        .catch((error) => {
          services.logger.error({ error, guildId: interaction.guildId }, 'Failed to write mod log');
        });
    }

    await interaction.reply({
      content: `👢 Kicked ${targetUser} (Case #${caseNumber})\n**Reason:** ${reason}`,
    });
  },
  featureKey: 'MODERATION',
};

