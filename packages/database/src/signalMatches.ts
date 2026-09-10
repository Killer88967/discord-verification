import type { VerificationSignalKind } from "../generated/prisma/enums.js";
import { prisma } from "./prisma.js";

export interface SignalMatchInput {
  kind: VerificationSignalKind;
  valueHash: string;
}

export interface SignalMatchedUser {
  userId: string;
  guildId: string;
  matchedKinds: VerificationSignalKind[];
}

export async function findSignalMatches(
  signals: SignalMatchInput[],
  excludeUserId: string,
): Promise<SignalMatchedUser[]> {
  if (signals.length === 0) {
    return [];
  }

  const matches = await prisma.verificationSignal.findMany({
    where: {
      OR: signals.map((signal) => ({
        kind: signal.kind,
        valueHash: signal.valueHash,
      })),

      session: {
        status: "VERIFIED",
        userId: {
          not: excludeUserId,
        },
      },
    },

    select: {
      kind: true,

      session: {
        select: {
          guildId: true,
          userId: true,
        },
      },
    },
  });

  const users = new Map<string, SignalMatchedUser>();

  for (const match of matches) {
    const existing = users.get(match.session.userId);

    if (existing) {
      if (!existing.matchedKinds.includes(match.kind)) {
        existing.matchedKinds.push(match.kind);
      }

      continue;
    }

    users.set(match.session.userId, {
      userId: match.session.userId,
      guildId: match.session.guildId,
      matchedKinds: [match.kind],
    });
  }

  return [...users.values()];
}
