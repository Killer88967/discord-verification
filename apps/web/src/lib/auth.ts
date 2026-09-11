import NextAuth from "next-auth";
import Discord from "next-auth/providers/discord";

const discordClientId = process.env.AUTH_DISCORD_ID;
const discordClientSecret = process.env.AUTH_DISCORD_SECRET;

if (!discordClientId) {
  throw new Error("AUTH_DISCORD_ID is not defined.");
}
if (!discordClientSecret) {
  throw new Error("AUTH_DISCORD_SECRET is not defined.");
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Discord({
      clientId: discordClientId,
      clientSecret: discordClientSecret,
      authorization: {
        params: {
          scope: "identify guilds",
        },
      },
    }),
  ],
});
