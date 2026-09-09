import { prisma } from "./prisma.js";

export interface ConfigureGuildOptions {
  guildId: string;
  guildName: string;
  verifiedRoleId: string;
  verificationChannelId: string;
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
