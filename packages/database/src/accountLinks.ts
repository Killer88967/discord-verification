import type {
  AccountLinkConfidence,
  AccountLinkReason,
  VerificationSignalKind,
} from "../generated/prisma/enums.js";
import { prisma } from "./prisma.js";

export interface UpsertAccountLinkOptions {
  userAId: string;
  userBId: string;
  reason: AccountLinkReason;
  confidence: AccountLinkConfidence;
  score: number;
  matchedSignals: VerificationSignalKind[];
}

export interface AccountLinkMatch {
  userId: string;
  reason: AccountLinkReason;
  confidence: AccountLinkConfidence;
  score: number;
  matchedSignals: VerificationSignalKind[];
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export async function upsertAccountLink({
  userAId,
  userBId,
  reason,
  confidence,
  score,
  matchedSignals,
}: UpsertAccountLinkOptions) {
  if (userAId === userBId) {
    throw new Error("Cannot link an account to itself.");
  }

  const [normalizedUserAId, normalizedUserBId] =
    userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const existing = await tx.accountLink.findUnique({
      where: {
        userAId_userBId: {
          userAId: normalizedUserAId,
          userBId: normalizedUserBId,
        },
      },
    });

    if (!existing) {
      return tx.accountLink.create({
        data: {
          userAId: normalizedUserAId,
          userBId: normalizedUserBId,
          reason,
          confidence,
          score,
          matchedSignals,
          firstSeenAt: now,
          lastSeenAt: now,
        },
      });
    }

    const mergedSignals = [
      ...new Set([...existing.matchedSignals, ...matchedSignals]),
    ];

    const deviceTokenMatched = mergedSignals.includes("DEVICE_TOKEN");

    const strongerAssessment =
      score > existing.score
        ? {
            score,
            confidence,
          }
        : {
            score: existing.score,
            confidence: existing.confidence,
          };

    return tx.accountLink.update({
      where: {
        id: existing.id,
      },
      data: {
        reason: deviceTokenMatched ? "DEVICE_TOKEN" : "SIGNAL_MATCH",
        confidence: strongerAssessment.confidence,
        score: strongerAssessment.score,
        matchedSignals: mergedSignals,
        lastSeenAt: now,
      },
    });
  });
}

export async function getAccountLinksForUser(
  userId: string,
): Promise<AccountLinkMatch[]> {
  const links = await prisma.accountLink.findMany({
    where: {
      OR: [
        {
          userAId: userId,
        },
        {
          userBId: userId,
        },
      ],
    },
    orderBy: {
      lastSeenAt: "desc",
    },
  });

  return links.map((link) => ({
    userId: link.userAId === userId ? link.userBId : link.userAId,
    reason: link.reason,
    confidence: link.confidence,
    score: link.score,
    matchedSignals: link.matchedSignals,
    firstSeenAt: link.firstSeenAt,
    lastSeenAt: link.lastSeenAt,
  }));
}
