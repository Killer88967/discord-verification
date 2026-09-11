export type MatchConfidence = "LOW" | "MEDIUM" | "HIGH";

export type MatchReason =
  | "DEVICE_TOKEN_MATCH"
  | "USER_AGENT_MATCH"
  | "TIMEZONE_MATCH"
  | "LANGUAGE_MATCH"
  | "PLATFORM_MATCH"
  | "SCREEN_MATCH"
  | "HARDWARE_MATCH";

export interface MatchSignal {
  reason: MatchReason;
  matched: boolean;
}

export interface MatchAssessment {
  score: number;
  confidence: MatchConfidence;
  reasons: MatchReason[];
}

const WEIGHTS: Record<MatchReason, number> = {
  DEVICE_TOKEN_MATCH: 70,
  USER_AGENT_MATCH: 5,
  TIMEZONE_MATCH: 3,
  LANGUAGE_MATCH: 3,
  PLATFORM_MATCH: 4,
  SCREEN_MATCH: 7,
  HARDWARE_MATCH: 8,
};
export function calculateMatchScore(matches: MatchSignal[]): MatchAssessment {
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

function getConfidence(score: number): MatchConfidence {
  if (score >= 70) {
    return "HIGH";
  }

  if (score >= 20) {
    return "MEDIUM";
  }

  return "LOW";
}
