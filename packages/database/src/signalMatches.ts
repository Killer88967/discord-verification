import type { VerificationSignalKind } from "../generated/prisma/enums.js";
import { prisma } from "./prisma.js";

export interface SignalMatchInput {
  kind: VerificationSignalKind;
  valueHash: string;
}

export interface SignalMatchedSession {
  sessionId: string;
  userId: string;
  guildId: string;
  matchedKinds: VerificationSignalKind[];
}

export async function findSignalMatches(
  signals: SignalMatchInput[],
  excludeUserId: string,
): Promise<SignalMatchedSession[]> {
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
          id: true,
          guildId: true,
          userId: true,
        },
      },
    },
  });

  const sessions = new Map<string, SignalMatchedSession>();

  for (const match of matches) {
    const existing = sessions.get(match.session.id);

    if (existing) {
      if (!existing.matchedKinds.includes(match.kind)) {
        existing.matchedKinds.push(match.kind);
      }

      continue;
    }

    sessions.set(match.session.id, {
      sessionId: match.session.id,
      userId: match.session.userId,
      guildId: match.session.guildId,
      matchedKinds: [match.kind],
    });
  }

  return [...sessions.values()];
}
