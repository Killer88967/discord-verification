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
}

export async function upsertAccountLink({
  userAId,
  userBId,
  reason,
  confidence,
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
      firstSeenAt: now,
      lastSeenAt: now,
    },
    update: {
      confidence,
      lastSeenAt: now,
    },
  });
}
