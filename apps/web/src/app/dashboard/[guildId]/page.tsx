import { auth } from "@/lib/auth";
import { getGuildOptions } from "@/lib/bot";
import {
  getGuildConfigSettings,
  getGuildSecurityPolicy,
} from "@verification/database";
import { updateGuildSettings, updateSecuritySettings } from "./actions";
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

  const [securityPolicy, guildConfig] = await Promise.all([
    getGuildSecurityPolicy(guildId),
    getGuildConfigSettings(guildId),
  ]);

  const guildOptions = guildConfig ? await getGuildOptions(guildId) : null;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-10 text-white">
      <div className="mx-auto w-full max-w-6xl">
        <Link
          href="/dashboard"
          className="text-sm text-zinc-400 transition hover:text-white"
        >
          ← Back to servers
        </Link>

        <header className="mt-6 flex flex-col justify-between gap-6 sm:flex-row sm:items-center">
          <div className="flex items-center gap-4">
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
          </div>

          <Link
            href={`/dashboard/${guildId}/logs`}
            className="inline-flex items-center justify-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2.5 text-sm font-medium text-zinc-200 transition hover:border-zinc-600 hover:bg-zinc-800"
          >
            Verification Logs
          </Link>
        </header>

        {!securityPolicy || !guildConfig || !guildOptions ? (
          <section className="mt-10 rounded-2xl border border-amber-900/50 bg-amber-950/20 p-6">
            <h2 className="text-lg font-semibold">Server not configured</h2>

            <p className="mt-2 text-sm text-zinc-400">
              This server does not have a Discord Verification configuration
              yet.
            </p>
          </section>
        ) : (
          <div className="mt-10 space-y-10">
            <form action={updateGuildSettings} className="space-y-6">
              <input type="hidden" name="guildId" value={guildId} />

              <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                <div>
                  <h2 className="text-lg font-semibold">
                    Server Configuration
                  </h2>

                  <p className="mt-1 text-sm text-zinc-500">
                    Configure the role and channels used by verification.
                  </p>
                </div>

                <div className="mt-6 grid gap-6 lg:grid-cols-3">
                  <label className="block">
                    <span className="text-sm font-medium">Verified role</span>

                    <p className="mt-1 text-sm text-zinc-500">
                      Role granted after successful verification.
                    </p>

                    <select
                      name="verifiedRoleId"
                      required
                      defaultValue={guildConfig.verifiedRoleId ?? ""}
                      className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    >
                      <option value="" disabled>
                        Select a role
                      </option>

                      {guildOptions.roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">
                      Verification channel
                    </span>

                    <p className="mt-1 text-sm text-zinc-500">
                      Channel where users start verification.
                    </p>

                    <select
                      name="verificationChannelId"
                      required
                      defaultValue={guildConfig.verificationChannelId ?? ""}
                      className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    >
                      <option value="" disabled>
                        Select a channel
                      </option>

                      {guildOptions.channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block">
                    <span className="text-sm font-medium">Log channel</span>

                    <p className="mt-1 text-sm text-zinc-500">
                      Optional channel for verification logs.
                    </p>

                    <select
                      name="logChannelId"
                      defaultValue={guildConfig.logChannelId ?? ""}
                      className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                    >
                      <option value="">Disabled</option>

                      {guildOptions.channels.map((channel) => (
                        <option key={channel.id} value={channel.id}>
                          #{channel.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                  >
                    Save Server Configuration
                  </button>
                </div>
              </section>
            </form>

            <form action={updateSecuritySettings} className="space-y-6">
              <input type="hidden" name="guildId" value={guildId} />

              <div className="grid gap-6 lg:grid-cols-2">
                <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                  <h2 className="text-lg font-semibold">Verification</h2>

                  <div className="mt-6 space-y-6">
                    <label className="flex items-center justify-between gap-6">
                      <div>
                        <p className="text-sm font-medium">
                          Verification enabled
                        </p>

                        <p className="mt-1 text-sm text-zinc-500">
                          Allow users to start verification.
                        </p>
                      </div>

                      <input
                        type="checkbox"
                        name="enabled"
                        defaultChecked={securityPolicy.enabled}
                        className="size-5"
                      />
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium">
                        Minimum account age
                      </span>

                      <p className="mt-1 text-sm text-zinc-500">
                        Discord accounts younger than this cannot verify.
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <input
                          type="number"
                          name="minimumAccountAgeDays"
                          min={0}
                          max={3650}
                          required
                          defaultValue={securityPolicy.minimumAccountAgeDays}
                          className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                        />

                        <span className="text-sm text-zinc-400">days</span>
                      </div>
                    </label>
                  </div>
                </section>

                <section className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6">
                  <h2 className="text-lg font-semibold">Risk Protection</h2>

                  <div className="mt-6 space-y-6">
                    <label className="block">
                      <span className="text-sm font-medium">
                        Risk threshold
                      </span>

                      <p className="mt-1 text-sm text-zinc-500">
                        Apply the configured action when this score is reached.
                      </p>

                      <div className="mt-3 flex items-center gap-3">
                        <input
                          type="number"
                          name="riskThreshold"
                          min={0}
                          max={100}
                          required
                          defaultValue={securityPolicy.riskThreshold}
                          className="w-32 rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                        />

                        <span className="text-sm text-zinc-400">/ 100</span>
                      </div>
                    </label>

                    <label className="block">
                      <span className="text-sm font-medium">Risk action</span>

                      <p className="mt-1 text-sm text-zinc-500">
                        Action performed when the risk threshold is reached.
                      </p>

                      <select
                        name="riskAction"
                        defaultValue={securityPolicy.riskAction}
                        className="mt-3 w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-zinc-500"
                      >
                        <option value="NONE">None</option>

                        <option value="REJECT">Reject Verification</option>

                        <option value="KICK">Kick User</option>

                        <option value="BAN">Ban User</option>
                      </select>
                    </label>
                  </div>
                </section>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black transition hover:bg-zinc-200"
                >
                  Save Security Settings
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
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
