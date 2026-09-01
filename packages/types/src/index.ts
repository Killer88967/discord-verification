export type VerificationStatus =
  | "PENDING"
  | "VERIFIED"
  | "REJECTED"
  | "EXPIRED";

export interface VerificationSession {
  id: string;

  guildId: string;
  userId: string;

  status: VerificationStatus;

  createdAt: Date;
  expiresAt: Date;
}
