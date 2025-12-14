import { ButtonInteraction, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from 'discord.js';
import { ServerConfig } from '../config/servers';
import {
  StatusView,
  buildDefaultViews,
  buildStatusEmbeds,
  buildViewComponents,
  fetchServerStatuses,
  getViewsFromMessage,
} from '../services/status';
import { isAdmin } from '../utils/permissions';

export interface CommandContext {
  servers: ServerConfig[];
  adminRoleId?: string;
  onViewChange?: (views: Map<string, StatusView>, messageId?: string) => void;
}

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

  const statuses = await fetchServerStatuses(context.servers);
  const views = buildDefaultViews(context.servers);
  const embeds = buildStatusEmbeds(context.servers, statuses, new Date(), views);

  await interaction.editReply({ embeds, components: buildViewComponents(context.servers, views) });
}

export async function handleMcStatusView(
  interaction: ButtonInteraction,
  context: CommandContext,
  request: { serverId: string; view: StatusView }
): Promise<void> {
  if (!isAdmin(interaction, context.adminRoleId)) {
    await interaction.reply({
      content: 'You need Administrator permissions to refresh this status.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferUpdate();

  const currentViews = getViewsFromMessage(interaction.message, context.servers);
  currentViews.set(request.serverId, request.view);

  if (context.onViewChange) {
    context.onViewChange(currentViews, interaction.message.id);
  }

  const statuses = await fetchServerStatuses(context.servers, { forceRefresh: true });
  const embeds = buildStatusEmbeds(context.servers, statuses, new Date(), currentViews);

  await interaction.editReply({ embeds, components: buildViewComponents(context.servers, currentViews) });
}
