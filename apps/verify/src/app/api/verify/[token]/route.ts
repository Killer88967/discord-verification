import { completeVerificationSession } from "@verification/database";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

interface VerifyRouteContext {
  params: Promise<{
    token: string;
  }>;
}

export async function POST(_request: Request, { params }: VerifyRouteContext) {
  const { token } = await params;

  const result = await completeVerificationSession(token);

  if (result.status === "VERIFIED") {
    await assignVerifiedRole(result.session.id);
  }

  return NextResponse.json({
    status: result.status,
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
    new URL("/internal/verificaion-complete", botInternalUrl),
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
