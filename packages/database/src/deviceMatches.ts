import { prisma } from "./prisma.js";

export interface DeviceMatch {
  guildId: string;
  userId: string;
  sessionId: string;
}

export async function findDeviceMatches(
  deviceTokenHash: string,
  currentUserId: string,
): Promise<DeviceMatch[]> {
  const signals = await prisma.verificationSignal.findMany({
    where: {
      kind: "DEVICE_TOKEN",
      valueHash: deviceTokenHash,
      session: {
        userId: {
          not: currentUserId,
        },
        status: "VERIFIED",
      },
    },
    select: {
      sessionId: true,
      session: {
        select: {
          guildId: true,
          userId: true,
        },
      },
    },
  });

  const matches = signals.map((signal) => ({
    sessionId: signal.sessionId,
    guildId: signal.session.guildId,
    userId: signal.session.userId,
  }));

  return [...new Map(matches.map((match) => [match.userId, match])).values()];
}
