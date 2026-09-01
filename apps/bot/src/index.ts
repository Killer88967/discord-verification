import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";

const token = process.env.DISCORD_TOKEN;

if (!token) {
  throw new Error("DISCORD_TOKEN is not defined.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once("clientReady", (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);
});

client.login(token);
