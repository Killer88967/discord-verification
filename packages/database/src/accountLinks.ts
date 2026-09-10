import type {
  AccountLinkConfidence,
  AccountLinkReason,
} from "../generated/prisma/enums.js";
import { prisma } from "./prisma.js";

export interface UpsertAccountLinkOptions {
  userAId: string;
  userBId: string;
  reason: AccountLinkReason;
  confidence: AccountLinkConfidence;
  score: number;
}

export interface AccountLinkMatch {
  userId: string;
  reason: AccountLinkReason;
  confidence: AccountLinkConfidence;
  score: number;
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export async function upsertAccountLink({
  userAId,
  userBId,
  reason,
  confidence,
  score,
}: UpsertAccountLinkOptions) {
  if (userAId === userBId) {
    throw new Error("Cannot link an account to itself.");
  }

  const [normalizedUserAId, normalizedUserBId] =
    userAId < userBId ? [userAId, userBId] : [userBId, userAId];

  const now = new Date();

  return prisma.accountLink.upsert({
    where: {
      userAId_userBId_reason: {
        userAId: normalizedUserAId,
        userBId: normalizedUserBId,
        reason,
      },
    },
    create: {
      userAId: normalizedUserAId,
      userBId: normalizedUserBId,
      reason,
      confidence,
      score,
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      confidence,
      score,
      lastSeenAt: now,
    },
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
    firstSeenAt: link.firstSeenAt,
    lastSeenAt: link.lastSeenAt,
  }));
}
