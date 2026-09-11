import { auth } from "@/lib/auth";
import { getGuildSecurityPolicy } from "@verification/database";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

interface GuildDashboardPageProps {
  params: Promise<{
    guildId: string;
  }>;
}

export default async function GuildDashboardPage({
  params,
}: GuildDashboardPageProps) {
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

  const securityPolicy = await getGuildSecurityPolicy(guildId);

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back to servers
        </Link>

        <header className="mt-6 flex items-center gap-4">
          <div className="relative size-16 shrink-0 overflow-hidden rounded-2xl bg-zinc-800">
            {guild.icon ? (
              <Image
                src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=128`}
                alt={`${guild.name} icon`}
                fill
                sizes="64px"
                className="object-cover"
              />
            ) : (
              <div className="flex size-full items-center justify-center text-xl font-semibold">
                {getGuildInitials(guild.name)}
              </div>
            )}
          </div>

          <div>
            <h1 className="text-3xl font-semibold">{guild.name}</h1>

            <p className="mt-1 text-sm text-zinc-400">
              {guild.owner ? "Server Owner" : "Server Manager"}
            </p>
          </div>
        </header>

        {!securityPolicy ? (
          <section className="mt-10 rounded-2xl border border-amber-900/50 bg-amber-950/20 p-6">
            <h2 className="text-lg font-semibold">Server not configured</h2>

            <p className="mt-2 text-sm text-zinc-400">
              This server does not have a Discord Verification configuration
              yet.
            </p>
          </section>
        ) : (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-lg font-semibold">Verification</h2>

              <dl className="mt-5 space-y-4">
                <SettingRow
                  label="Status"
                  value={securityPolicy.enabled ? "Enabled" : "Disabled"}
                />

                <SettingRow
                  label="Minimum account age"
                  value={`${securityPolicy.minimumAccountAgeDays} days`}
                />
              </dl>
            </section>

            <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
              <h2 className="text-lg font-semibold">Risk Protection</h2>

              <dl className="mt-5 space-y-4">
                <SettingRow
                  label="Risk threshold"
                  value={`${securityPolicy.riskThreshold}/100`}
                />

                <SettingRow
                  label="Risk action"
                  value={formatRiskAction(securityPolicy.riskAction)}
                />
              </dl>
            </section>
          </div>
        )}
      </div>
    </main>
  );
}

function SettingRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-6">
      <dt className="text-sm text-zinc-400">{label}</dt>
      <dd className="text-sm font-medium">{value}</dd>
    </div>
  );
}

function getGuildInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

function formatRiskAction(action: "NONE" | "REJECT" | "KICK" | "BAN"): string {
  switch (action) {
    case "NONE":
      return "None";

    case "REJECT":
      return "Reject Verification";

    case "KICK":
      return "Kick User";

    case "BAN":
      return "Ban User";
  }
}
