import { createVerificationSession } from "@verification/database";
import {
  ChatInputCommandInteraction,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

const verifyUrl = process.env.VERIFY_URL;

if (!verifyUrl) {
  throw new Error("VERIFY_URL is not defined.");
}

export const verifyCommand = {
  data: new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Create a verification link for this server."),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    const session = await createVerificationSession({
      guildId: interaction.guild.id,
      guildName: interaction.guild.name,
      userId: interaction.user.id,
    });

    const url = new URL(`/verify/${session.token}`, verifyUrl);

    await interaction.editReply({
      content: [
        "Your verification link is ready.",
        "",
        url.toString(),
        "",
        "This link expires in 10 minutes and can only be used once.",
      ].join("\n"),
    });
  },
};
