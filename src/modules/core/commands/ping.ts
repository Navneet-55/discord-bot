import { type ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import type { Command } from '../../../shared/interactions/commandRouter';

export const ping: Command = {
  name: 'ping',
  data: new SlashCommandBuilder().setName('ping').setDescription('Check bot latency'),
  async execute(interaction, services) {
    const sent = await interaction.reply({
      content: 'Pinging...',
      fetchReply: true,
      ephemeral: true,
    });

    const latency = sent.createdTimestamp - interaction.createdTimestamp;
    const apiLatency = Math.round(interaction.client.ws.ping);

    await interaction.editReply({
      content: `🏓 Pong!\n**Latency:** ${latency}ms\n**API Latency:** ${apiLatency}ms`,
    });
  },
  featureKey: 'CORE',
};

