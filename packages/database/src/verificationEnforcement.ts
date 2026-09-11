import { prisma } from "./prisma.js";

export type VerificationEnforcementTargetResult =
  | {
      status: "READY";
      session: {
        id: string;
        guildId: string;
        userId: string;
        action: "KICK" | "BAN";
      };
    }
  | {
      status: "NOT_FOUND";
    }
  | {
      status: "NOT_REJECTED";
    }
  | {
      status: "NOT_CONFIGURED";
    }
  | {
      status: "NO_ENFORCEMENT";
    };

export async function getVerificationEnforcementTarget(
  sessionId: string,
): Promise<VerificationEnforcementTargetResult> {
  const session = await prisma.verificationSession.findUnique({
    where: {
      id: sessionId,
    },
    select: {
      id: true,
      guildId: true,
      userId: true,
      status: true,
      guild: {
        select: {
          config: {
            select: {
              enabled: true,
              riskAction: true,
            },
          },
        },
      },
    },
  });

  if (!session) {
    return {
      status: "NOT_FOUND",
    };
  }

  if (session.status !== "REJECTED") {
    return {
      status: "NOT_REJECTED",
    };
  }

  const config = session.guild.config;

  if (!config || !config.enabled) {
    return {
      status: "NOT_CONFIGURED",
    };
  }

  if (config.riskAction !== "KICK" && config.riskAction !== "BAN") {
    return {
      status: "NO_ENFORCEMENT",
    };
  }

  return {
    status: "READY",
    session: {
      id: "",
      guildId: "",
      userId: "",
      action: "KICK",
    },
  };
}
