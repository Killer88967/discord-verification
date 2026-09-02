import { createHash, randomBytes } from "node:crypto";
import { prisma } from "./prisma.js";

const DEFAULT_SESSION_TTL_MS = 10 * 60 * 1000;

export interface CreateVerificationSessionOptions {
  guildId: string;
  guildName?: string;
  userId: string;
  ttlMs?: number;
}

export interface CreatedVerificationSession {
  id: string;
  token: string;
  expiresAt: Date;
}

function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function createVerificationSession({
  guildId,
  guildName,
  userId,
  ttlMs = DEFAULT_SESSION_TTL_MS,
}: CreateVerificationSessionOptions): Promise<CreatedVerificationSession> {
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashVerificationToken(token);
  const expiresAt = new Date(Date.now() + ttlMs);

  const session = await prisma.$transaction(async (tx) => {
    await tx.guild.upsert({
      where: {
        id: guildId,
      },
      create: {
        id: guildId,
        ...(guildName !== undefined
          ? {
              name: guildName,
            }
          : {}),
      },
      update: {
        ...(guildName !== undefined
          ? {
              name: guildName,
            }
          : {}),
      },
    });

    const createdSession = await tx.verificationSession.create({
      data: {
        guildId,
        userId,
        tokenHash,
        expiresAt,
      },
    });

    await tx.verificationEvent.create({
      data: {
        guildId,
        sessionId: createdSession.id,
        userId,
        type: "SESSION_CREATED",
      },
    });

    return createdSession;
  });

  return {
    id: session.id,
    token,
    expiresAt: session.expiresAt,
  };
}
