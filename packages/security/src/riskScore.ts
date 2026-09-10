export type RiskConfidence = "LOW" | "MEDIUM" | "HIGH";

export type RiskReason =
  | "DEVICE_TOKEN_MATCH"
  | "USER_AGENT_MATCH"
  | "TIMEZONE_MATCH"
  | "LANGUAGE_MATCH"
  | "PLATFORM_MATCH"
  | "SCREEN_MATCH"
  | "HARDWARE_MATCH";

export interface RiskSignalMatch {
  reason: RiskReason;
  matched: boolean;
}

export interface RiskAssessment {
  score: number;
  confidence: RiskConfidence;
  reasons: RiskReason[];
}

const WEIGHTS: Record<RiskReason, number> = {
  DEVICE_TOKEN_MATCH: 70,
  USER_AGENT_MATCH: 5,
  TIMEZONE_MATCH: 3,
  LANGUAGE_MATCH: 3,
  PLATFORM_MATCH: 4,
  SCREEN_MATCH: 7,
  HARDWARE_MATCH: 8,
};

export function calculateRiskScore(matches: RiskSignalMatch[]): RiskAssessment {
  const reasons = matches
    .filter((match) => match.matched)
    .map((match) => match.reason);

  const score = Math.min(
    100,
    reasons.reduce((total, reason) => total + WEIGHTS[reason], 0),
  );

  return {
    score,
    confidence: getConfidence(score),
    reasons,
  };
}

function getConfidence(score: number): RiskConfidence {
  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 20) {
    return "MEDIUM";
  }

  return "LOW";
}
