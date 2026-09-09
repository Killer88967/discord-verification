import { createVerificationSession } from "@verification/database";

const verifyUrl = process.env.VERIFY_URL;

if (!verifyUrl) {
  throw new Error("VERIFY_URL is not defined.");
}

interface CreateVerificationLinkOptions {
  guildId: string;
  guildName: string;
  userId: string;
}

export async function createVerificationLink({
  guildId,
  guildName,
  userId,
}: CreateVerificationLinkOptions): Promise<string> {
  const session = await createVerificationSession({
    guildId,
    guildName,
    userId,
  });

  return new URL(`/verify/${session.token}`, verifyUrl).toString();
}
