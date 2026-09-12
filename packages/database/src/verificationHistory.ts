import type {
  VerificationEventType,
  VerificationStatus,
} from "../generated/prisma/enums.js";
import { prisma } from "./prisma.js";

export interface VerificationHistoryEvent {
  type: VerificationEventType;
  createdAt: Date;
}

export interface VerificationHistoryEntry {
  id: string;
  userId: string;
  status: VerificationStatus;
  createdAt: Date;
  expiresAt: Date;
  completedAt: Date | null;
  events: VerificationHistoryEvent[];
}

export async function getGuildVerificationHistory(
  guildId: string,
  limit = 50,
): Promise<VerificationHistoryEntry[]> {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new RangeError("limit must be an integer between 1 and 100.");
  }

  return prisma.verificationSession.findMany({
    where: {
      guildId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: limit,
    select: {
      id: true,
      userId: true,
      status: true,
      createdAt: true,
      expiresAt: true,
      completedAt: true,
      events: {
        orderBy: {
          createdAt: "asc",
        },
        select: {
          type: true,
          createdAt: true,
        },
      },
    },
  });
}
