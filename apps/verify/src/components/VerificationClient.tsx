"use client";

import { useEffect, useRef, useState } from "react";

interface VerificationClientProps {
  token: string;
}

type VerificationState =
  | "CHECKING"
  | "VERIFIED"
  | "EXPIRED"
  | "USED"
  | "INVALID"
  | "ERROR";

export function VerificationClient({ token }: VerificationClientProps) {
  const [state, setState] = useState<VerificationState>("CHECKING");
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return;
    }

    started.current = true;

    async function verify(): Promise<void> {
      try {
        const response = await fetch(
          `/api/verify/${encodeURIComponent(token)}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
          },
        );

        if (!response.ok) {
          throw new Error(`Verification request failed: ${response.status}`);
        }

        const data = (await response.json()) as {
          status: "VERIFIED" | "EXPIRED" | "USED" | "INVALID";
        };

        setState(data.status);
      } catch (error) {
        console.error("Verification failed:", error);
        setState("ERROR");
      }
    }

    void verify();
  }, [token]);

  if (state === "CHECKING") {
    return (
      <VerificationProgress
        title="Verifying..."
        description="Checking your verification session."
      />
    );
  }

  if (state === "VERIFIED") {
    return (
      <VerificationProgress
        title="Verified"
        description="Verification completed successfully. You can return to Discord."
        success
      />
    );
  }

  if (state === "EXPIRED") {
    return (
      <VerificationProgress
        title="Link expired"
        description="Return to Discord and request a new verification link."
      />
    );
  }

  if (state === "USED") {
    return (
      <VerificationProgress
        title="Already used"
        description="This verification session has already been completed."
      />
    );
  }

  if (state === "INVALID") {
    return (
      <VerificationProgress
        title="Invalid session"
        description="This verification session could not be found."
      />
    );
  }

  return (
    <VerificationProgress
      title="Verification failed"
      description="Something went wrong while verifying. Please try again."
    />
  );
}

function VerificationProgress({
  title,
  description,
  success = false,
}: {
  title: string;
  description: string;
  success?: boolean;
}) {
  return (
    <div className="text-center">
      <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-full bg-zinc-800 text-xl">
        {success ? "✓" : "…"}
      </div>

      <h2 className="text-lg font-semibold">{title}</h2>

      <p className="mt-2 text-sm leading-6 text-zinc-400">{description}</p>
    </div>
  );
}
