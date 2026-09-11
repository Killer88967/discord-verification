import "dotenv/config";
import { getGuildSecurityPolicy } from "@verification/database";
import { Client, GatewayIntentBits, REST, Routes } from "discord.js";
import { commands } from "./commands/index.js";
import { startInternalServer } from "./internal/server.js";
import { createVerificationLink } from "./verification/createVerificationLink.js";

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;
const internalApiSecret = process.env.INTERNAL_API_SECRET;
const internalApiPort = Number(process.env.INTERNAL_API_PORT ?? "3100");

if (!token) {
  throw new Error("DISCORD_TOKEN is not defined.");
}

if (!clientId) {
  throw new Error("DISCORD_CLIENT_ID is not defined.");
}

if (!internalApiSecret) {
  throw new Error("INTERNAL_API_SECRET is not defined.");
}

if (!Number.isInteger(internalApiPort) || internalApiPort <= 0) {
  throw new Error("INTERNAL_API_PORT is invalid.");
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

const rest = new REST({
  version: "10",
}).setToken(token);

client.once("clientReady", async (readyClient) => {
  console.log(`Logged in as ${readyClient.user.tag}`);

  startInternalServer({
    client: readyClient,
    secret: internalApiSecret,
    port: internalApiPort,
  });

  await rest.put(
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
  if (interaction.isButton() && interaction.customId === "verification:start") {
    if (!interaction.inCachedGuild()) {
      return;
    }

    try {
      await interaction.deferReply({
        flags: 64,
      });

      const securityPolicy = await getGuildSecurityPolicy(interaction.guild.id);

      if (securityPolicy?.enabled && securityPolicy.minimumAccountAgeDays > 0) {
        const minimumAgeMs =
          securityPolicy.minimumAccountAgeDays * 24 * 60 * 60 * 1000;

        const eligibleAt = interaction.user.createdTimestamp + minimumAgeMs;

        if (Date.now() < eligibleAt) {
          const eligibleAtUnix = Math.floor(eligibleAt / 1000);

          await interaction.editReply({
            content: [
              "Your Discord account is too new to verify in this server.",
              "",
              `Accounts must be at least **${securityPolicy.minimumAccountAgeDays} day${securityPolicy.minimumAccountAgeDays === 1 ? "" : "s"} old**.`,
              `You can verify <t:${eligibleAtUnix}:R>.`,
            ].join("\n"),
          });

          return;
        }
      }

      const url = await createVerificationLink({
        guildId: interaction.guild.id,
        guildName: interaction.guild.name,
        userId: interaction.user.id,
      });

      await interaction.editReply({
        content: [
          "Your verification link is ready.",
          "",
          url,
          "",
          "This link expires in 10 minutes and can only be used once.",
        ].join("\n"),
      });
    } catch (error) {
      console.error("Failed to create verification link:", error);

      if (interaction.deferred || interaction.replied) {
        await interaction.editReply({
          content:
            "Something went wrong while creating your verification link.",
        });
      } else {
        await interaction.reply({
          content:
            "Something went wrong while creating your verification link.",
          flags: 64,
        });
      }
    }

    return;
  }

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
    await command.run(interaction);
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
