import { getAccountLinksForUser } from "@verification/database";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../types/Command.js";

export const checkCommand = new Command()
  .name("check")
  .description("Check a user for verification relationships.")
  .guildOnly()
  .permissions(PermissionFlagsBits.ModerateMembers)
  .ephemeral()
  .userOption("user", "The user to check.", {
    required: true,
  })
  .execute(async (interaction) => {
    const user = interaction.options.getUser("user", true);
    const links = await getAccountLinksForUser(user.id);

    const linkedAccounts =
      links.length === 0
        ? "No linked accounts found."
        : links
            .slice(0, 10)
            .map((link) =>
              [
                `<@${link.userId}>`,
                `\`${link.userId}\``,
                `Reason: ${link.reason}`,
                `Confidence: ${link.confidence}`,
              ].join("\n"),
            )
            .join("\n\n");

    const extra =
      links.length > 10 ? `\n\n...and ${links.length - 10} more.` : "";

    const embed = new EmbedBuilder()
      .setTitle("Verification Check")
      .setDescription(`${user}\n\`${user.id}\``)
      .addFields({
        name: `Linked Accounts (${links.length})`,
        value: `${linkedAccounts}${extra}`,
      })
      .setColor(0x5865f2)
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  });
