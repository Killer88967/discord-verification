import type { VerificationSignalKind } from "../generated/prisma/enums.js";
import { prisma } from "./prisma.js";

export interface StoredVerificationSignal {
  kind: VerificationSignalKind;
  valueHash: string;
}

export interface StoreVerificationSignalsOptions {
  sessionId: string;
  deviceTokenHash: string;
  signals: StoredVerificationSignal[];
}

export async function storeVerificationSignals({
  sessionId,
  deviceTokenHash,
  signals,
}: StoreVerificationSignalsOptions): Promise<void> {
  await prisma.$transaction(async (tx) => {
    await tx.browserDevice.upsert({
      where: {
        deviceTokenHash,
      },
      create: {
        deviceTokenHash,
      },
      update: {},
    });

    await tx.verificationSignal.createMany({
      data: signals.map((signal) => ({
        sessionId,
        kind: signal.kind,
        valueHash: signal.valueHash,
      })),
    });
  });
}
