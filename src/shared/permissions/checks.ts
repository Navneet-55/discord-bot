import {
  GuildMember,
  PermissionFlagsBits,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { logger } from '../logging/logger';

export interface PermissionCheckResult {
  allowed: boolean;
  reason?: string;
}

export function checkModeratorPermissions(
  interaction: ChatInputCommandInteraction
): PermissionCheckResult {
  if (!interaction.member || !(interaction.member instanceof GuildMember)) {
    return { allowed: false, reason: 'Command must be used in a guild' };
  }

  const member = interaction.member;

  // Check if user has moderation permissions
  if (!member.permissions.has(PermissionFlagsBits.ModerateMembers)) {
    return { allowed: false, reason: 'You need moderation permissions to use this command' };
  }

  return { allowed: true };
}

export function checkCanModerate(
  moderator: GuildMember,
  target: GuildMember
): PermissionCheckResult {
  // Cannot moderate server owner
  if (target.id === target.guild.ownerId) {
    return { allowed: false, reason: 'Cannot moderate the server owner' };
  }

  // Cannot moderate self
  if (moderator.id === target.id) {
    return { allowed: false, reason: 'Cannot moderate yourself' };
  }

  // Check role hierarchy
  if (target.roles.highest.position >= moderator.roles.highest.position) {
    return {
      allowed: false,
      reason: 'Cannot moderate members with equal or higher roles',
    };
  }

  return { allowed: true };
}

export function checkAdminPermissions(
  interaction: ChatInputCommandInteraction
): PermissionCheckResult {
  if (!interaction.member || !(interaction.member instanceof GuildMember)) {
    return { allowed: false, reason: 'Command must be used in a guild' };
  }

  const member = interaction.member;

  // Check if user has admin permissions
  if (!member.permissions.has(PermissionFlagsBits.Administrator)) {
    return { allowed: false, reason: 'You need administrator permissions to use this command' };
  }

  return { allowed: true };
}

