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

export type VerificationSessionLookupResult =
  | {
      status: "VALID";
      session: {
        id: string;
        guildId: string;
        userId: string;
        expiresAt: Date;
      };
    }
  | {
      status: "INVALID";
    }
  | {
      status: "EXPIRED";
    }
  | {
      status: "USED";
    };

function hashVerificationToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export async function getVerificationSessionByToken(
  token: string,
): Promise<VerificationSessionLookupResult> {
  const tokenHash = hashVerificationToken(token);

  const session = await prisma.verificationSession.findUnique({
    where: {
      tokenHash,
    },
    select: {
      id: true,
      guildId: true,
      userId: true,
      status: true,
      expiresAt: true,
    },
  });

  if (!session) {
    return {
      status: "INVALID",
    };
  }

  if (session.status !== "PENDING") {
    return {
      status: "USED",
    };
  }

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.$transaction(async (tx) => {
      await tx.verificationSession.update({
        where: {
          id: session.id,
        },
        data: {
          status: "EXPIRED",
        },
      });

      await tx.verificationEvent.create({
        data: {
          guildId: session.guildId,
          sessionId: session.id,
          userId: session.userId,
          type: "EXPIRED",
        },
      });
    });

    return {
      status: "EXPIRED",
    };
  }

  return {
    status: "VALID",
    session: {
      id: session.id,
      guildId: session.guildId,
      userId: session.userId,
      expiresAt: session.expiresAt,
    },
  };
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
