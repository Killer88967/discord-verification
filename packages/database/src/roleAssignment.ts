import { prisma } from "./prisma.js";

export type RoleAssignmentTargetResult =
  | {
      status: "READY";
      session: {
        id: string;
        guildId: string;
        userId: string;
        verifiedRoleId: string;
      };
    }
  | {
      status: "NOT_FOUND";
    }
  | {
      status: "NOT_VERIFIED";
    }
  | {
      status: "NOT_CONFIGURED";
    };

export async function getRoleAssignmentTarget(
  sessionId: string,
): Promise<RoleAssignmentTargetResult> {
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
              verifiedRoleId: true,
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

  if (session.status !== "VERIFIED") {
    return {
      status: "NOT_VERIFIED",
    };
  }

  const config = session.guild.config;

  if (!config || !config.enabled || !config.verifiedRoleId) {
    return {
      status: "NOT_CONFIGURED",
    };
  }

  return {
    status: "READY",
    session: {
      id: session.id,
      guildId: session.guildId,
      userId: session.userId,
      verifiedRoleId: config.verifiedRoleId,
    },
  };
}
