import { auth, signIn, signOut } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-6 text-white">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-8">
        <h1 className="text-3xl font-semibold">Discord Verification</h1>

        <p className="mt-3 text-zinc-400">
          Manage verification and security settings for your Discord servers.
        </p>

        {session?.user ? (
          <div className="mt-8">
            <p className="text-sm text-zinc-400">Signed in as</p>

            <p className="mt-1 font-medium">
              {session.user.name ?? "Discord User"}
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="/dashboard"
                className="rounded-lg bg-indigo-500 px-4 py-2 font-medium transition hover:bg-indigo-400"
              >
                Open Dashboard
              </a>

              <form
                action={async () => {
                  "use server";

                  await signOut();
                }}
              >
                <button
                  type="submit"
                  className="rounded-lg border border-zinc-700 px-4 py-2 font-medium transition hover:bg-zinc-800"
                >
                  Sign Out
                </button>
              </form>
            </div>
          </div>
        ) : (
          <form
            className="mt-8"
            action={async () => {
              "use server";

              await signIn("discord", {
                redirectTo: "/dashboard",
              });
            }}
          >
            <button
              type="submit"
              className="w-full rounded-lg bg-indigo-500 px-4 py-3 font-medium transition hover:bg-indigo-400"
            >
              Continue with Discord
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
