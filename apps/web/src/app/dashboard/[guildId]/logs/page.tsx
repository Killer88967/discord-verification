import { auth } from "@/lib/auth";
import {
  getGuildVerificationHistory,
  type VerificationHistoryEntry,
} from "@verification/database";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface LogsPageProps {
  params: Promise<{
    guildId: string;
  }>;
}

export default async function LogsPage({ params }: LogsPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const { guildId } = await params;

  const guild = session.manageableGuilds.find(
    (manageableGuild) => manageableGuild.id === guildId,
  );

  if (!guild) {
    notFound();
  }

  const history = await getGuildVerificationHistory(guildId);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex items-center justify-between gap-4">
          <div>
            <Link
              href={`/dashboard/${guildId}`}
              className="text-sm text-zinc-400 transition hover:text-white"
            >
              ← Back to server
            </Link>

            <h1 className="mt-6 text-3xl font-semibold">Verification Logs</h1>

            <p className="mt-2 text-sm text-zinc-400">
              Recent verification activity for {guild.name}.
            </p>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-right">
            <p className="text-xs uppercase tracking-wide text-zinc-500">
              Recent sessions
            </p>

            <p className="mt-1 text-2xl font-semibold">{history.length}</p>
          </div>
        </div>

        {history.length === 0 ? (
          <section className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
            <h2 className="text-lg font-semibold">No verification history</h2>

            <p className="mt-2 text-sm text-zinc-500">
              Verification attempts will appear here once users begin verifying.
            </p>
          </section>
        ) : (
          <div className="mt-10 space-y-4">
            {history.map((entry) => (
              <VerificationLogCard key={entry.id} entry={entry} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function VerificationLogCard({ entry }: { entry: VerificationHistoryEntry }) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="font-medium">User {entry.userId}</h2>

            <StatusBadge status={entry.status} />
          </div>

          <p className="mt-2 text-xs text-zinc-500">Session {entry.id}</p>
        </div>

        <div className="text-sm text-zinc-400 sm:text-right">
          <p>Started {formatDate(entry.createdAt)}</p>

          {entry.completedAt ? (
            <p className="mt-1">Completed {formatDate(entry.completedAt)}</p>
          ) : (
            <p className="mt-1">Expires {formatDate(entry.expiresAt)}</p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-zinc-800 pt-5">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Event Timeline
        </p>

        <div className="mt-4 space-y-3">
          {entry.events.map((event, index) => (
            <div
              key={`${event.type}-${event.createdAt.toISOString()}-${index}`}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <span className="text-zinc-300">
                {formatEventType(event.type)}
              </span>

              <span className="shrink-0 text-zinc-500">
                {formatDate(event.createdAt)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function StatusBadge({
  status,
}: {
  status: VerificationHistoryEntry["status"];
}) {
  const classes = {
    PENDING: "border-amber-800 bg-amber-950/40 text-amber-300",
    VERIFIED: "border-emerald-800 bg-emerald-950/40 text-emerald-300",
    REJECTED: "border-red-800 bg-red-950/40 text-red-300",
    EXPIRED: "border-zinc-700 bg-zinc-800 text-zinc-300",
  } satisfies Record<VerificationHistoryEntry["status"], string>;

  return (
    <span
      className={`rounded-full border px-2.5 py-1 text-xs font-medium ${classes[status]}`}
    >
      {formatStatus(status)}
    </span>
  );
}

function formatStatus(status: VerificationHistoryEntry["status"]): string {
  switch (status) {
    case "PENDING":
      return "Pending";

    case "VERIFIED":
      return "Verified";

    case "REJECTED":
      return "Rejected";

    case "EXPIRED":
      return "Expired";
  }
}

function formatEventType(
  type: VerificationHistoryEntry["events"][number]["type"],
): string {
  switch (type) {
    case "SESSION_CREATED":
      return "Session created";

    case "SESSION_OPENED":
      return "Verification page opened";

    case "VERIFIED":
      return "Verification completed";

    case "REJECTED":
      return "Verification rejected";

    case "EXPIRED":
      return "Session expired";
  }
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
