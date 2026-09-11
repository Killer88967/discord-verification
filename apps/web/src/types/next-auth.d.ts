import type { DefaultSession } from "next-auth";
import type { ManageableDiscordGuild } from "@/lib/discord";

declare module "next-auth" {
  interface Session extends DefaultSession {
    manageableGuilds: ManageableDiscordGuild[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    manageableGuilds: ManageableDiscordGuild[];
  }
}
