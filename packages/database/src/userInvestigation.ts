import { prisma } from "./prisma.js";

export interface UserInvestigation {
  verified: boolean;
  firstVerifiedAt: Date | null;
  lastVerifiedAt: Date | null;
  verificationCount: number;
  rejectedCount: number;
  latestSessionStatus: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED" | null;
  latestSessionAt: Date | null;
}

export async function getUserInvestigation(
  guildId: string,
  userId: string,
): Promise<UserInvestigation> {
  const [verifiedUser, sessions, rejectedCount] = await Promise.all([
    prisma.verifiedUser.findUnique({
      where: {
        guildId_userId: {
          guildId,
          userId,
        },
      },
      select: {
        firstVerifiedAt: true,
        lastVerifiedAt: true,
      },
    }),

    prisma.verificationSession.findMany({
      where: {
        guildId,
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 1,
      select: {
        status: true,
        createdAt: true,
      },
    }),

    prisma.verificationSession.count({
      where: {
        guildId,
        userId,
        status: "REJECTED",
      },
    }),
  ]);

  const verificationCount = await prisma.verificationSession.count({
    where: {
      guildId,
      userId,
      status: "VERIFIED",
    },
  });

  const latestSession = sessions[0] ?? null;

  return {
    verified: verifiedUser !== null,
    firstVerifiedAt: verifiedUser?.firstVerifiedAt ?? null,
    lastVerifiedAt: verifiedUser?.lastVerifiedAt ?? null,
    verificationCount,
    rejectedCount,
    latestSessionStatus: latestSession?.status ?? null,
    latestSessionAt: latestSession?.createdAt ?? null,
  };
}
