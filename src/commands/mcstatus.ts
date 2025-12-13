import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonInteraction,
  ButtonStyle,
  ChatInputCommandInteraction,
  EmbedBuilder,
  GuildMemberRoleManager,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from 'discord.js';
import { ServerConfig } from '../config/servers';
import { fetchTelemetry, TelemetryResponse } from '../services/telemetry';
import { logger } from '../utils/logger';

export const MCSTATUS_REFRESH_ID = 'mcstatus_refresh';

export interface CommandContext {
  servers: ServerConfig[];
  adminRoleId?: string;
}

const isAdmin = (interaction: { memberPermissions: any; member: any }, adminRoleId?: string) => {
  const hasAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator);
  if (hasAdmin) return true;

  if (adminRoleId && interaction.member && 'roles' in interaction.member) {
    const roles = interaction.member.roles as GuildMemberRoleManager;
    if (roles?.cache?.has(adminRoleId)) return true;
  }

  return false;
};

const formatServerField = (server: ServerConfig, telemetry?: TelemetryResponse, error?: Error) => {
  if (telemetry) {
    const players = telemetry.players?.length ?? 0;
    return `TPS: ${telemetry.tps.toFixed(1)} | MSPT: ${telemetry.mspt.toFixed(1)}ms | Players: ${players}`;
  }

  if (error) {
    logger.warn(`Failed to fetch telemetry for ${server.name}: ${error.message}`);
  }

  return 'OFFLINE/NO DATA';
};

const buildEmbed = (servers: ServerConfig[], telemetry: Map<string, TelemetryResponse>, errors: Map<string, Error>) => {
  const embed = new EmbedBuilder().setTitle('Minecraft Server Status').setColor(0x2d3136);

  servers.forEach((server) => {
    const data = telemetry.get(server.id);
    const error = errors.get(server.id);

    embed.addFields({
      name: server.name,
      value: formatServerField(server, data, error),
    });
  });

  return embed;
};

export const mcStatusCommand = new SlashCommandBuilder()
  .setName('mcstatus')
  .setDescription('Show the status of configured Minecraft servers')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function executeMcStatus(
  interaction: ChatInputCommandInteraction,
  context: CommandContext
): Promise<void> {
  if (!isAdmin(interaction, context.adminRoleId)) {
    await interaction.reply({
      content: 'You need Administrator permissions to use this command.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply();

  const telemetry = new Map<string, TelemetryResponse>();
  const errors = new Map<string, Error>();

  await Promise.all(
    context.servers.map(async (server) => {
      try {
        const result = await fetchTelemetry(server);
        telemetry.set(server.id, result);
      } catch (error) {
        errors.set(server.id, error as Error);
      }
    })
  );

  const embed = buildEmbed(context.servers, telemetry, errors);

  const components = [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setCustomId(MCSTATUS_REFRESH_ID)
        .setLabel('Refresh')
        .setStyle(ButtonStyle.Primary)
    ),
  ];

  await interaction.editReply({ embeds: [embed], components });
}

export async function handleMcStatusRefresh(
  interaction: ButtonInteraction,
  context: CommandContext
): Promise<void> {
  if (!isAdmin(interaction, context.adminRoleId)) {
    await interaction.reply({
      content: 'You need Administrator permissions to refresh this status.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferUpdate();

  const telemetry = new Map<string, TelemetryResponse>();
  const errors = new Map<string, Error>();

  await Promise.all(
    context.servers.map(async (server) => {
      try {
        const result = await fetchTelemetry(server, { forceRefresh: true });
        telemetry.set(server.id, result);
      } catch (error) {
        errors.set(server.id, error as Error);
      }
    })
  );

  const embed = buildEmbed(context.servers, telemetry, errors);

  await interaction.editReply({ embeds: [embed] });
}
