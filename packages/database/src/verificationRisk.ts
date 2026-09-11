import { prisma } from "./prisma.js";

export type VerificationRiskContextResult =
  | {
      status: "READY";
      session: {
        id: string;
        guildId: string;
        userId: string;
      };
      linkedUserIds: string[];
    }
  | {
      status: "NOT_FOUND";
    }
  | {
      status: "NOT_PENDING";
    };

export async function getVerificationRiskContext(
  sessionId: string,
): Promise<VerificationRiskContextResult> {
  const session = await prisma.verificationSession.findUnique({
    where: {
      id: sessionId,
    },
    select: {
      id: true,
      guildId: true,
      userId: true,
      status: true,
    },
  });

  if (!session) {
    return {
      status: "NOT_FOUND",
    };
  }

  if (session.status !== "PENDING") {
    return {
      status: "NOT_PENDING",
    };
  }

  const links = await prisma.accountLink.findMany({
    where: {
      OR: [
        {
          userAId: session.userId,
        },
        {
          userBId: session.userId,
        },
      ],
    },
    select: {
      userAId: true,
      userBId: true,
    },
  });

  return {
    status: "READY",
    session: {
      id: session.id,
      guildId: session.guildId,
      userId: session.userId,
    },
    linkedUserIds: links.map((link) =>
      link.userAId === session.userId ? link.userBId : link.userAId,
    ),
  };
}
