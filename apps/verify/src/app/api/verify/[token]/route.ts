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

  return NextResponse.json({
    status: result.status,
  });
}
