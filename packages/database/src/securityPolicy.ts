import type { VerificationRiskAction } from "../generated/prisma/enums.js";
import { prisma } from "./prisma.js";

export interface GuildSecurityPolicy {
  enabled: boolean;
  minimumAccountAgeDays: number;
  riskThreshold: number;
  riskAction: VerificationRiskAction;
}

export interface UpdateGuildSecurityPolicyOptions {
  guildId: string;
  enabled?: boolean;
  minimumAccountAgeDays?: number;
  riskThreshold?: number;
  riskAction?: VerificationRiskAction;
}

export async function getGuildSecurityPolicy(
  guildId: string,
): Promise<GuildSecurityPolicy | null> {
  return prisma.guildConfig.findUnique({
    where: {
      guildId,
    },
    select: {
      enabled: true,
      minimumAccountAgeDays: true,
      riskThreshold: true,
      riskAction: true,
    },
  });
}

export async function updateGuildSecurityPolicy({
  guildId,
  enabled,
  minimumAccountAgeDays,
  riskThreshold,
  riskAction,
}: UpdateGuildSecurityPolicyOptions): Promise<GuildSecurityPolicy> {
  if (minimumAccountAgeDays !== undefined) {
    if (
      !Number.isInteger(minimumAccountAgeDays) ||
      minimumAccountAgeDays < 0 ||
      minimumAccountAgeDays > 3650
    ) {
      throw new RangeError(
        "minimumAccountAgeDays must be an integer between 0 and 3650.",
      );
    }
  }

  if (riskThreshold !== undefined) {
    if (
      !Number.isInteger(riskThreshold) ||
      riskThreshold < 0 ||
      riskThreshold > 100
    ) {
      throw new RangeError(
        "riskThreshold must be an integer between 0 and 100.",
      );
    }
  }

  return prisma.guildConfig.update({
    where: {
      guildId,
    },
    data: {
      ...(enabled !== undefined
        ? {
            enabled,
          }
        : {}),
      ...(minimumAccountAgeDays !== undefined
        ? {
            minimumAccountAgeDays,
          }
        : {}),
      ...(riskThreshold !== undefined
        ? {
            riskThreshold,
          }
        : {}),
      ...(riskAction !== undefined
        ? {
            riskAction,
          }
        : {}),
    },
    select: {
      enabled: true,
      minimumAccountAgeDays: true,
      riskThreshold: true,
      riskAction: true,
    },
  });
}
