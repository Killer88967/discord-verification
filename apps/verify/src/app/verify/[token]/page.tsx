import { getVerificationSessionByToken } from "@verification/database";
import Link from "next/link";

interface VerifyPageProps {
  params: Promise<{
    token: string;
  }>;
}

export default async function VerifyPage({ params }: VerifyPageProps) {
  const { token } = await params;

  const result = await getVerificationSessionByToken(token);

  if (result.status === "INVALID") {
    return (
      <VerificationState
        title="Invalid verification link"
        description="This verification link does not exist."
      />
    );
  }

  if (result.status === "EXPIRED") {
    return (
      <VerificationState
        title="Verification link expired"
        description="This verification link has expired. Return to Discord and run /verify again."
      />
    );
  }

  if (result.status === "USED") {
    return (
      <VerificationState
        title="Verification link already used"
        description="This verification link can no longer be used."
      />
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-6">
          <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-indigo-500 text-xl font-bold">
            ✓
          </div>

          <h1 className="text-2xl font-semibold">
            Verify your Discord account
          </h1>

          <p className="mt-2 text-sm leading-6 text-zinc-400">
            Continue with Discord to verify that this account belongs to you.
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Verification session
          </div>

          <div className="mt-2 text-sm text-zinc-300">
            This link is valid and waiting for authentication.
          </div>
        </div>

        <Link
          href={`/api/auth/discord?token=${encodeURIComponent(token)}`}
          className="flex h-11 w-full items-center justify-center rounded-lg bg-indigo-500 font-medium transition hover:bg-indigo-400"
        >
          Continue with Discord
        </Link>

        <p className="mt-5 text-center text-xs text-zinc-500">
          This verification session can only be completed once.
        </p>
      </div>
    </main>
  );
}

function VerificationState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-800 text-xl">
          !
        </div>

        <h1 className="text-xl font-semibold">{title}</h1>

        <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
      </div>
    </main>
  );
}
