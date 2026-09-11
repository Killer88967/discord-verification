import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";

export const metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/");
  }

  const guilds = session.manageableGuilds;

  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-12 text-white">
      <div className="mx-auto w-full max-w-5xl">
        <header className="flex items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold">Select a Server</h1>

            <p className="mt-2 text-zinc-400">
              Choose a Discord server you have permission to manage.
            </p>
          </div>

          <form
            action={async () => {
              "use server";

              await signOut({
                redirectTo: "/",
              });
            }}
          >
            <button
              type="submit"
              className="rounded-lg border border-zinc-700 px-4 py-2 text-sm font-medium transition hover:bg-zinc-900"
            >
              Sign Out
            </button>
          </form>
        </header>

        {guilds.length === 0 ? (
          <div className="mt-10 rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <p className="font-medium">No manageable servers found.</p>

            <p className="mt-2 text-sm text-zinc-400">
              You need to own a server or have the Manage Server or
              Administrator permission.
            </p>
          </div>
        ) : (
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {guilds.map((guild) => (
              <a
                key={guild.id}
                href={`/dashboard/${guild.id}`}
                className="group rounded-xl border border-zinc-800 bg-zinc-900 p-5 transition hover:border-zinc-700 hover:bg-zinc-800"
              >
                <div className="flex items-center gap-4">
                  <div className="relative size-12 shrink-0 overflow-hidden rounded-xl bg-zinc-800">
                    {guild.icon ? (
                      <Image
                        src={`https://cdn.discordapp.com/icons/${guild.id}/${guild.icon}.png?size=96`}
                        alt={`${guild.name} icon`}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex size-full items-center justify-center text-lg font-semibold">
                        {getGuildInitials(guild.name)}
                      </div>
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium">{guild.name}</p>

                    <p className="mt-1 text-sm text-zinc-500">
                      {guild.owner ? "Owner" : "Manager"}
                    </p>
                  </div>
                </div>
              </a>
            ))}
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
