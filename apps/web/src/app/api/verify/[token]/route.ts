import {
  completeVerificationSession,
  findDeviceMatches,
  getVerificationSessionByToken,
  storeVerificationSignals,
} from "@verification/database";
import { hashSignal } from "@verification/security";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface VerifyRouteContext {
  params: Promise<{
    token: string;
  }>;
}

interface VerificationRequestBody {
  deviceId: string;

  signals: {
    timezone: string;
    language: string;
    languages: string[];
    platform: string;

    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelRatio: number;
    };

    hardwareConcurrency: number;
    maxTouchPoints: number;
  };
}

export async function POST(request: Request, { params }: VerifyRouteContext) {
  const { token } = await params;

  const secret = process.env.FINGERPRINT_HMAC_SECRET;

  if (!secret) {
    throw new Error("FINGERPRINT_HMAC_SECRET is not defined.");
  }

  const body = (await request.json()) as VerificationRequestBody;

  if (!body || typeof body.deviceId !== "string" || !body.signals) {
    return NextResponse.json(
      {
        error: "Invalid verification payload.",
      },
      {
        status: 400,
      },
    );
  }

  const lookup = await getVerificationSessionByToken(token);

  if (lookup.status !== "VALID") {
    return NextResponse.json({
      status: lookup.status,
    });
  }

  const sessionId = lookup.session.id;
  const deviceTokenHash = hashSignal(body.deviceId, secret);
  const userAgent = request.headers.get("user-agent") ?? "unknown";
  const deviceMatches = await findDeviceMatches(
    deviceTokenHash,
    lookup.session.userId,
  );

  await storeVerificationSignals({
    sessionId,
    deviceTokenHash,
    signals: [
      {
        kind: "DEVICE_TOKEN",
        valueHash: deviceTokenHash,
      },
      {
        kind: "USER_AGENT",
        valueHash: hashSignal(userAgent, secret),
      },
      {
        kind: "TIMEZONE",
        valueHash: hashSignal(body.signals.timezone, secret),
      },
      {
        kind: "LANGUAGE",
        valueHash: hashSignal(
          JSON.stringify({
            language: body.signals.language,
            languages: body.signals.languages,
          }),
          secret,
        ),
      },
      {
        kind: "PLATFORM",
        valueHash: hashSignal(body.signals.platform, secret),
      },
      {
        kind: "SCREEN",
        valueHash: hashSignal(JSON.stringify(body.signals.screen), secret),
      },
      {
        kind: "HARDWARE",
        valueHash: hashSignal(
          JSON.stringify({
            hardwareConcurrency: body.signals.hardwareConcurrency,
            maxTouchPoints: body.signals.maxTouchPoints,
          }),
          secret,
        ),
      },
    ],
  });

  const result = await completeVerificationSession(token);

  if (result.status === "VERIFIED") {
    await assignVerifiedRole(result.session.id);
  }

  return NextResponse.json({
    status: result.status,
    deviceMatches:
      result.status === "VERIFIED"
        ? deviceMatches.map((match) => ({
            guildId: match.guildId,
            userId: match.userId,
          }))
        : [],
  });
}

async function assignVerifiedRole(sessionId: string): Promise<void> {
  const botInternalUrl = process.env.BOT_INTERNAL_URL;
  const internalApiSecret = process.env.INTERNAL_API_SECRET;

  if (!botInternalUrl) {
    throw new Error("BOT_INTERNAL_URL is not defined.");
  }

  if (!internalApiSecret) {
    throw new Error("INTERNAL_API_SECRET is not defined.");
  }

  const response = await fetch(
    new URL("/internal/verification-complete", botInternalUrl),
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${internalApiSecret}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        sessionId,
      }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    const body = await response.text();

    throw new Error(`Bot role assignment failed: ${response.status} ${body}`);
  }
}
