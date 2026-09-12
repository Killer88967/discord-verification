import { auth } from "@/lib/auth";
import { getGuildUsers, type GuildUser } from "@/lib/bot";
import {
  getUserInvestigationDetails,
  type AccountLinkMatch,
  type UserInvestigation,
} from "@verification/database";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface InvestigationPageProps {
  params: Promise<{
    guildId: string;
    userId: string;
  }>;
}

export default async function InvestigationPage({
  params,
}: InvestigationPageProps) {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const { guildId, userId } = await params;

  const guild = session.manageableGuilds.find(
    (manageableGuild) => manageableGuild.id === guildId,
  );

  if (!guild) {
    notFound();
  }

  const details = await getUserInvestigationDetails(guildId, userId);

  const userIds = [
    ...new Set([userId, ...details.links.map((link) => link.userId)]),
  ];

  const users = await resolveGuildUsers(guildId, userIds);

  const usersById = new Map(users.map((user) => [user.id, user]));

  const targetUser = usersById.get(userId);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto max-w-5xl">
        <Link
          href={`/dashboard/${guildId}`}
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back to {guild.name}
        </Link>

        <header className="mt-6">
          <p className="text-sm font-medium text-indigo-400">
            User Investigation
          </p>

          <div className="mt-4 flex items-center gap-4">
            <UserAvatar user={targetUser} size="large" />

            <div className="min-w-0">
              <h1 className="truncate text-3xl font-semibold">
                {targetUser?.displayName ??
                  targetUser?.username ??
                  "Unknown Discord User"}
              </h1>

              {targetUser?.username ? (
                <p className="mt-1 text-sm text-zinc-400">
                  @{targetUser.username}
                  {!targetUser.inGuild ? " · No longer in server" : ""}
                </p>
              ) : null}

              <p className="mt-1 font-mono text-xs text-zinc-500">{userId}</p>
            </div>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-xl font-semibold">Verification Summary</h2>

          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryCard
              label="Verified"
              value={details.investigation.verified ? "Yes" : "No"}
            />

            <SummaryCard
              label="Successful Verifications"
              value={String(details.investigation.verificationCount)}
            />

            <SummaryCard
              label="Rejected Attempts"
              value={String(details.investigation.rejectedCount)}
            />

            <SummaryCard
              label="Latest Session"
              value={formatSessionStatus(
                details.investigation.latestSessionStatus,
              )}
            />
          </div>

          <VerificationDates investigation={details.investigation} />
        </section>

        <section className="mt-10">
          <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-semibold">Linked Accounts</h2>

              <p className="mt-1 text-sm text-zinc-400">
                Accounts connected through verification signals.
              </p>
            </div>

            <p className="text-sm text-zinc-500">
              {details.links.length} relationship
              {details.links.length === 1 ? "" : "s"}
            </p>
          </div>

          <div className="mt-4 rounded-xl border border-indigo-900/60 bg-indigo-950/20 p-4 text-sm text-indigo-200">
            A high match score means the accounts are strongly correlated. It
            does not automatically mean either account is malicious.
          </div>

          {details.links.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-zinc-800 bg-zinc-900 p-8 text-center">
              <h3 className="font-medium">No linked accounts found</h3>

              <p className="mt-2 text-sm text-zinc-400">
                No other accounts with verification history in this server are
                currently linked to this user.
              </p>
            </div>
          ) : (
            <div className="mt-6 space-y-4">
              {details.links.map((link) => (
                <LinkedAccountCard
                  key={link.userId}
                  guildId={guildId}
                  link={link}
                  user={usersById.get(link.userId)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

async function resolveGuildUsers(
  guildId: string,
  userIds: string[],
): Promise<GuildUser[]> {
  const users: GuildUser[] = [];

  for (let index = 0; index < userIds.length; index += 100) {
    const batch = userIds.slice(index, index + 100);

    users.push(...(await getGuildUsers(guildId, batch)));
  }

  return users;
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-5">
      <p className="text-sm text-zinc-400">{label}</p>

      <p className="mt-2 text-xl font-semibold">{value}</p>
    </div>
  );
}

function VerificationDates({
  investigation,
}: {
  investigation: UserInvestigation;
}) {
  const dates = [
    investigation.firstVerifiedAt
      ? {
          label: "First verified",
          value: investigation.firstVerifiedAt,
        }
      : null,
    investigation.lastVerifiedAt
      ? {
          label: "Last verified",
          value: investigation.lastVerifiedAt,
        }
      : null,
    investigation.latestSessionAt
      ? {
          label: "Latest attempt",
          value: investigation.latestSessionAt,
        }
      : null,
  ].filter(
    (
      entry,
    ): entry is {
      label: string;
      value: Date;
    } => entry !== null,
  );

  if (dates.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 grid gap-4 sm:grid-cols-3">
      {dates.map((entry) => (
        <div
          key={entry.label}
          className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-4"
        >
          <p className="text-xs text-zinc-500">{entry.label}</p>

          <p className="mt-1 text-sm text-zinc-300">
            {formatDate(entry.value)}
          </p>
        </div>
      ))}
    </div>
  );
}

function LinkedAccountCard({
  guildId,
  link,
  user,
}: {
  guildId: string;
  link: AccountLinkMatch;
  user: GuildUser | undefined;
}) {
  return (
    <article className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
      <div className="flex flex-col justify-between gap-5 sm:flex-row">
        <div className="flex min-w-0 items-center gap-4">
          <UserAvatar user={user} />

          <div className="min-w-0">
            <Link
              href={`/dashboard/${guildId}/investigate/${link.userId}`}
              className="truncate font-medium transition hover:text-indigo-300"
            >
              {user?.displayName ?? user?.username ?? `User ${link.userId}`}
            </Link>

            {user?.username ? (
              <p className="mt-0.5 text-xs text-zinc-500">
                @{user.username}
                {!user.inGuild ? " · No longer in server" : ""}
              </p>
            ) : null}

            <p className="mt-1 font-mono text-xs text-zinc-600">
              {link.userId}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-start gap-2">
          <ConfidenceBadge confidence={link.confidence} />

          <div className="rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1 text-xs font-medium text-zinc-300">
            {link.score}/100 match
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Detail label="Relationship" value={formatReason(link.reason)} />

        <Detail
          label="Matched Signals"
          value={formatSignals(link.matchedSignals)}
        />

        <Detail label="First Seen" value={formatDate(link.firstSeenAt)} />

        <Detail label="Last Seen" value={formatDate(link.lastSeenAt)} />
      </div>
    </article>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
        {label}
      </p>

      <p className="mt-1 text-sm text-zinc-300">{value}</p>
    </div>
  );
}

function UserAvatar({
  user,
  size = "normal",
}: {
  user: GuildUser | undefined;
  size?: "normal" | "large";
}) {
  const className =
    size === "large" ? "size-16 rounded-2xl" : "size-12 rounded-full";

  if (user?.avatarUrl) {
    return (
      <img
        src={user.avatarUrl}
        alt=""
        className={`${className} shrink-0 object-cover`}
      />
    );
  }

  return (
    <div
      className={`${className} flex shrink-0 items-center justify-center bg-zinc-800 font-medium text-zinc-400`}
    >
      ?
    </div>
  );
}

function ConfidenceBadge({
  confidence,
}: {
  confidence: AccountLinkMatch["confidence"];
}) {
  const classes = {
    LOW: "border-zinc-700 bg-zinc-800 text-zinc-300",
    MEDIUM: "border-amber-800 bg-amber-950/40 text-amber-300",
    HIGH: "border-emerald-800 bg-emerald-950/40 text-emerald-300",
  } satisfies Record<AccountLinkMatch["confidence"], string>;

  return (
    <span
      className={`rounded-full border px-3 py-1 text-xs font-medium ${classes[confidence]}`}
    >
      {formatEnum(confidence)} confidence
    </span>
  );
}

function formatSessionStatus(
  status: UserInvestigation["latestSessionStatus"],
): string {
  if (status === null) {
    return "None";
  }

  return formatEnum(status);
}

function formatReason(reason: AccountLinkMatch["reason"]): string {
  switch (reason) {
    case "DEVICE_TOKEN":
      return "Device Token";

    case "SIGNAL_MATCH":
      return "Browser Signal Match";
  }
}

function formatSignals(signals: AccountLinkMatch["matchedSignals"]): string {
  if (signals.length === 0) {
    return "None";
  }

  return signals.map(formatEnum).join(", ");
}

function formatEnum(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
