import "dotenv/config";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  throw new Error("DISCORD_TOKEN is not defined.");
}

if (!clientId) {
  throw new Error("DISCORD_CLIENT_ID is not defined.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const rest = new REST({
  version: "10",
}).setToken(token);

client.once("clientReady", async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  await rest.put(
    // Routes.applicationCommands(clientId)
    Routes.applicationGuildCommands(
      clientId,
      process.env.DISCORD_DEV_GUILD_ID as string,
    ),
    {
      body: commands.map((command) => command.data.toJSON()),
    },
  );

  console.log(`Registered ${commands.length} application command(s).`);
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) {
    return;
  }

  const command = commands.find(
    (command) => command.data.name === interaction.commandName,
  );

  if (!command) {
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Failed to execute /${interaction.commandName}:`, error);

    const message = {
      content: "Something went wrong while executing this command.",
      flags: 64,
    } as const;

    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(message);
    } else {
      await interaction.reply(message);
    }
  }
});

await client.login(token);
