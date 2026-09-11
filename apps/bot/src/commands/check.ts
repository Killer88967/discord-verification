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
        ? "No linked accounts found in this server."
        : guildLinks
            .slice(0, 10)
            .map((link) =>
              [
                `<@${link.userId}>`,
                `\`${link.userId}\``,
                `Reason: ${formatReason(link.reason)}`,
                `Confidence: ${link.confidence}`,
                `Match Score: ${link.score}/100`,
                `Signals: ${formatSignals(link.matchedSignals)}`,
                `First Seen: <t:${Math.floor(link.firstSeenAt.getTime() / 1000)}:R>`,
                `Last Seen: <t:${Math.floor(link.lastSeenAt.getTime() / 1000)}:R>`,
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

function formatReason(reason: "DEVICE_TOKEN" | "SIGNAL_MATCH"): string {
  switch (reason) {
    case "DEVICE_TOKEN":
      return "Device Token";

    case "SIGNAL_MATCH":
      return "Browser Signal Match";
  }
}

function formatSignals(
  signals: (
    | "DEVICE_TOKEN"
    | "USER_AGENT"
    | "TIMEZONE"
    | "LANGUAGE"
    | "PLATFORM"
    | "SCREEN"
    | "HARDWARE"
    | "NETWORK"
  )[],
): string {
  return signals
    .map((signal) =>
      signal
        .toLowerCase()
        .split("_")
        .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
        .join(" "),
    )
    .join(", ");
}
