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
    const existing = await tx.accountLink.upsert({
      where: {
        userAId_userBId: {
          userAId: normalizedUserAId,
          userBId: normalizedUserBId,
        },
      },
      create: {
        userAId: normalizedUserAId,
        userBId: normalizedUserBId,
        reason,
        confidence,
        score,
        matchedSignals,
        firstSeenAt: now,
        lastSeenAt: now,
      },
      update: {
        lastSeenAt: now,
      },
    });

    const shouldReplaceEvidence =
      score > existing.score ||
      (score === existing.score &&
        reason === "DEVICE_TOKEN" &&
        existing.reason !== "DEVICE_TOKEN");

    if (!shouldReplaceEvidence) {
      return existing;
    }

    return tx.accountLink.update({
      where: {
        id: existing.id,
      },
      data: {
        reason,
        confidence,
        score,
        matchedSignals,
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

export async function getGuildAccountLinksForUser(
  guildId: string,
  userId: string,
): Promise<AccountLinkMatch[]> {
  const links = await getAccountLinksForUser(userId);

  if (links.length === 0) {
    return [];
  }

  const linkedUserIds = links.map((link) => link.userId);

  const guildUsers = await prisma.verificationSession.findMany({
    where: {
      guildId,
      userId: {
        in: linkedUserIds,
      },
    },
    select: {
      userId: true,
    },
    distinct: ["userId"],
  });

  const guildUserIds = new Set(guildUsers.map((session) => session.userId));

  return links.filter((link) => guildUserIds.has(link.userId));
}
