import { prisma } from "./prisma.js";

export interface ConfigureGuildOptions {
  guildId: string;
  guildName: string;
  verifiedRoleId: string;
  verificationChannelId: string;
}

export interface GuildConfigSettings {
  verifiedRoleId: string | null;
  verificationChannelId: string | null;
  logChannelId: string | null;
}

export interface UpdateGuildConfigSettingsOptions {
  guildId: string;
  verifiedRoleId?: string | null;
  verificationChannelId?: string | null;
  logChannelId?: string | null;
}

export async function configureGuild({
  guildId,
  guildName,
  verifiedRoleId,
  verificationChannelId,
}: ConfigureGuildOptions) {
  return prisma.$transaction(async (tx) => {
    await tx.guild.upsert({
      where: {
        id: guildId,
      },
      create: {
        id: guildId,
        name: guildName,
      },
      update: {
        name: guildName,
      },
    });

    return tx.guildConfig.upsert({
      where: {
        guildId,
      },
      create: {
        guildId,
        verifiedRoleId,
        verificationChannelId,
        enabled: true,
      },
      update: {
        verifiedRoleId,
        verificationChannelId,
        enabled: true,
      },
    });
  });
}

export async function getGuildConfigSettings(
  guildId: string,
): Promise<GuildConfigSettings | null> {
  return prisma.guildConfig.findUnique({
    where: {
      guildId,
    },
    select: {
      verifiedRoleId: true,
      verificationChannelId: true,
      logChannelId: true,
    },
  });
}

export async function updateGuildConfigSettings({
  guildId,
  verifiedRoleId,
  verificationChannelId,
  logChannelId,
}: UpdateGuildConfigSettingsOptions): Promise<GuildConfigSettings> {
  return prisma.guildConfig.update({
    where: {
      guildId,
    },
    data: {
      ...(verifiedRoleId !== undefined
        ? {
            verifiedRoleId,
          }
        : {}),
      ...(verificationChannelId !== undefined
        ? {
            verificationChannelId,
          }
        : {}),
      ...(logChannelId !== undefined
        ? {
            logChannelId,
          }
        : {}),
    },
    select: {
      verifiedRoleId: true,
      verificationChannelId: true,
      logChannelId: true,
    },
  });
}
