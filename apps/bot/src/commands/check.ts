import { getAccountLinksForUser } from "@verification/database";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../types/command/index.js";

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

    const guildLinks = (
      await Promise.all(
        links.map(async (link) => {
          const member =
            interaction.guild.members.cache.get(link.userId) ??
            (await interaction.guild.members
              .fetch(link.userId)
              .catch(() => null));

          if (!member) {
            return null;
          }

          return link;
        }),
      )
    ).filter((link) => link !== null);

    const linkedAccounts =
      guildLinks.length === 0
        ? "No linked accounts found."
        : guildLinks
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
      guildLinks.length > 10
        ? `\n\n...and ${guildLinks.length - 10} more.`
        : "";

    const embed = new EmbedBuilder()
      .setTitle("Verification Check")
      .setDescription(`${user}\n\`${user.id}\``)
      .addFields({
        name: `Linked Accounts (${guildLinks.length})`,
        value: `${linkedAccounts}${extra}`,
      })
      .setColor(0x5865f2)
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  });
