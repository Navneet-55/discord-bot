import { SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../shared/interactions/commandRouter';

export const health: Command = {
  name: 'health',
  data: new SlashCommandBuilder().setName('health').setDescription('Check bot and database health'),
  async execute(interaction, services) {
    await interaction.deferReply({ ephemeral: true });

    const parts: string[] = [];
    parts.push('✅ **Bot:** Online');

    // Check database connectivity
    try {
      await services.prisma.$queryRaw`SELECT 1`;
      parts.push('✅ **Database:** Connected');
    } catch (error) {
      parts.push('❌ **Database:** Connection failed');
      services.logger.error({ error }, 'Database health check failed');
    }

    await interaction.editReply({
      content: parts.join('\n'),
    });
  },
  featureKey: 'CORE',
};
