import { createVerificationLink } from "../verification/createVerificationLink.js";
import { Command } from "../types/Command.js";

const verifyUrl = process.env.VERIFY_URL;

if (!verifyUrl) {
  throw new Error("VERIFY_URL is not defined.");
}

export const verifyCommand = new Command()
  .name("verify")
  .description("Create a verification link for this server.")
  .guildOnly()
  .ephemeral()
  .execute(async (interaction) => {
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
        "This link expires in 10 minutes and can only be used one.",
      ].join("\n"),
    });
  });
