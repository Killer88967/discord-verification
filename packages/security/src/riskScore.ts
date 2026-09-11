export type RiskReason = "LINKED_BANNED_ACCOUNT";

export interface RiskSignal {
  reason: RiskReason;
  matched: boolean;
}

export interface RiskAssessment {
  score: number;
  reasons: RiskReason[];
}

const WEIGHTS: Record<RiskReason, number> = {
  LINKED_BANNED_ACCOUNT: 100,
};

export function calculateRiskScore(signals: RiskSignal[]): RiskAssessment {
  const reasons = signals
    .filter((signal) => signal.matched)
    .map((signal) => signal.reason);

  const score = Math.min(
    100,
    reasons.reduce((total, reason) => total + WEIGHTS[reason], 0),
  );

  return {
    score,
    reasons,
  };
}
