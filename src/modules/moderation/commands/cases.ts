import {
  type ChatInputCommandInteraction,
  SlashCommandBuilder,
  EmbedBuilder,
} from 'discord.js';
import { checkModeratorPermissions } from '../../../shared/permissions/checks';
import { prisma } from '../../../shared/db/prisma';
import type { Command } from '../../../shared/interactions/commandRouter';

const TYPE_EMOJIS: Record<string, string> = {
  WARN: '⚠️',
  KICK: '👢',
  BAN: '🔨',
  TIMEOUT: '⏱️',
};

export const cases: Command = {
  name: 'cases',
  data: new SlashCommandBuilder()
    .setName('cases')
    .setDescription('View moderation cases')
    .addUserOption((option) =>
      option.setName('user').setDescription('Filter cases by user')
    ),
  async execute(interaction, services) {
    if (!interaction.guildId) {
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

    const targetUser = interaction.options.getUser('user');

    const where: { guildId: string; userId?: string } = {
      guildId: interaction.guildId,
    };

    if (targetUser) {
      where.userId = targetUser.id;
    }

    const cases = await prisma.modCase.findMany({
      where,
      orderBy: { caseNumber: 'desc' },
      take: 10,
    });

    if (cases.length === 0) {
      await interaction.reply({
        content: targetUser
          ? `No cases found for ${targetUser}`
          : 'No cases found for this guild',
        ephemeral: true,
      });
      return;
    }

    const embed = new EmbedBuilder()
      .setTitle(targetUser ? `Cases for ${targetUser.tag}` : 'Recent Cases')
      .setColor(0x5865f2)
      .setTimestamp();

    const description = cases
      .map((c) => {
        const emoji = TYPE_EMOJIS[c.type] || '📝';
        const date = new Date(c.createdAt).toLocaleDateString();
        return `${emoji} **Case #${c.caseNumber}** - ${c.type}\n<@${c.userId}> by <@${c.moderatorId}>\n${c.reason || 'No reason'}\n*${date}*`;
      })
      .join('\n\n');

    embed.setDescription(description);

    await interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
  featureKey: 'MODERATION',
};

