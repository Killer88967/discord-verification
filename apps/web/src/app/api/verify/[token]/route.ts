import {
  completeVerificationSession,
  findSignalMatches,
  getGuildSecurityPolicy,
  getVerificationSessionByToken,
  rejectVerificationSession,
  storeVerificationSignals,
  upsertAccountLink,
  type SignalMatchInput,
} from "@verification/database";
import {
  calculateRiskScore,
  hashSignal,
  type RiskReason,
} from "@verification/security";
import { NextResponse } from "next/server";
import { validateVerificationPayload } from "@/lib/verification/validateVerificationPayload";
import { readJsonBody } from "@/lib/http/readJsonBody";

export const runtime = "nodejs";
const MAX_VERIFICATION_BODY_BYTES = 16 * 1024;

interface VerifyRouteContext {
  params: Promise<{
    token: string;
  }>;
}

export async function POST(request: Request, { params }: VerifyRouteContext) {
  const { token } = await params;

  const secret = process.env.FINGERPRINT_HMAC_SECRET;

  if (!secret) {
    throw new Error("FINGERPRINT_HMAC_SECRET is not defined.");
  }

  const bodyResult = await readJsonBody(request, MAX_VERIFICATION_BODY_BYTES);

  if (bodyResult.status === "TOO_LARGE") {
    return NextResponse.json(
      {
        error: "Verification payload is too large.",
      },
      {
        status: 413,
      },
    );
  }

  if (bodyResult.status === "INVALID_JSON") {
    return NextResponse.json(
      {
        error: "Invalid JSON payload.",
      },
      {
        status: 400,
      },
    );
  }

  const body = validateVerificationPayload(bodyResult.value);

  if (!body) {
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
  const signals: SignalMatchInput[] = [
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
  ];

  const signalMatches = await findSignalMatches(signals, lookup.session.userId);

  const assessments = signalMatches.map((match) => ({
    match,
    assessment: calculateRiskScore(
      match.matchedKinds.map((kind) => ({
        matched: true,
        reason: signalKindToRiskReason(kind),
      })),
    ),
  }));

  const bestAssessments = new Map<string, (typeof assessments)[number]>();

  for (const candidate of assessments) {
    const existing = bestAssessments.get(candidate.match.userId);

    if (
      !existing ||
      candidate.assessment.score > existing.assessment.score ||
      (candidate.assessment.score === existing.assessment.score &&
        candidate.match.matchedKinds.includes("DEVICE_TOKEN") &&
        !existing.match.matchedKinds.includes("DEVICE_TOKEN"))
    ) {
      bestAssessments.set(candidate.match.userId, candidate);
    }
  }

  const strongestAssessments = [...bestAssessments.values()];

  const highestRiskScore = strongestAssessments.reduce(
    (highest, current) => Math.max(highest, current.assessment.score),
    0,
  );

  const securityPolicy = await getGuildSecurityPolicy(lookup.session.guildId);

  await storeVerificationSignals({
    sessionId,
    deviceTokenHash,
    signals,
  });

  const shouldReject =
    securityPolicy !== null &&
    securityPolicy.enabled &&
    securityPolicy.riskAction !== "NONE" &&
    highestRiskScore >= securityPolicy.riskThreshold;

  if (shouldReject) {
    const rejected = await rejectVerificationSession(token);

    if (rejected.status !== "REJECTED") {
      return NextResponse.json({
        status: rejected.status,
      });
    }

    return NextResponse.json({
      status: "REJECTED",
    });
  }

  const result = await completeVerificationSession(token);

  if (result.status === "VERIFIED") {
    await Promise.all(
      strongestAssessments.map(({ match, assessment }) => {
        const deviceTokenMatched = match.matchedKinds.includes("DEVICE_TOKEN");

        return upsertAccountLink({
          userAId: result.session.userId,
          userBId: match.userId,
          reason: deviceTokenMatched ? "DEVICE_TOKEN" : "SIGNAL_MATCH",
          confidence: assessment.confidence,
          score: assessment.score,
          matchedSignals: match.matchedKinds,
        });
      }),
    );

    await assignVerifiedRole(result.session.id);
  }

  return NextResponse.json({
    status: result.status,
    matchCount: result.status === "VERIFIED" ? strongestAssessments.length : 0,
  });
}

function signalKindToRiskReason(kind: SignalMatchInput["kind"]): RiskReason {
  switch (kind) {
    case "DEVICE_TOKEN":
      return "DEVICE_TOKEN_MATCH";

    case "USER_AGENT":
      return "USER_AGENT_MATCH";

    case "TIMEZONE":
      return "TIMEZONE_MATCH";

    case "LANGUAGE":
      return "LANGUAGE_MATCH";

    case "PLATFORM":
      return "PLATFORM_MATCH";

    case "SCREEN":
      return "SCREEN_MATCH";

    case "HARDWARE":
      return "HARDWARE_MATCH";

    case "NETWORK":
      throw new Error("NETWORK signal scoring is not implemented yet.");
  }
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
