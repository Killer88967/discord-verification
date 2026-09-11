import {
  getGuildAccountLinksForUser,
  getUserInvestigation,
} from "@verification/database";
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

    const [investigation, links] = await Promise.all([
      getUserInvestigation(interaction.guild.id, user.id),
      getGuildAccountLinksForUser(interaction.guild.id, user.id),
    ]);

    const linkedAccounts = await Promise.all(
      links.slice(0, 10).map(async (link) => {
        const member =
          interaction.guild.members.cache.get(link.userId) ??
          (await interaction.guild.members
            .fetch(link.userId)
            .catch(() => null));

        return {
          ...link,
          inGuild: member !== null,
        };
      }),
    );

    const accountSummary = [
      `Verified: ${investigation.verified ? "Yes" : "No"}`,
      `Successful Verifications: ${investigation.verificationCount}`,
      `Rejected Attempts: ${investigation.rejectedCount}`,
      `Latest Session: ${formatSessionStatus(
        investigation.latestSessionStatus,
      )}`,
      investigation.firstVerifiedAt
        ? `First Verified: <t:${toUnix(investigation.firstVerifiedAt)}:R>`
        : null,
      investigation.lastVerifiedAt
        ? `Last Verified: <t:${toUnix(investigation.lastVerifiedAt)}:R>`
        : null,
      investigation.latestSessionAt
        ? `Latest Attempt: <t:${toUnix(investigation.latestSessionAt)}:R>`
        : null,
    ]
      .filter((value): value is string => value !== null)
      .join("\n");

    const relationshipSummary =
      linkedAccounts.length === 0
        ? "No linked accounts found."
        : linkedAccounts
            .map((link) =>
              [
                link.inGuild
                  ? `<@${link.userId}>`
                  : `Discord User \`${link.userId}\``,
                `Server Status: ${
                  link.inGuild ? "Currently in server" : "Not in server"
                }`,
                `Reason: ${formatReason(link.reason)}`,
                `Confidence: ${link.confidence}`,
                `Match Score: ${link.score}/100`,
                `Signals: ${formatSignals(link.matchedSignals)}`,
                `First Seen: <t:${toUnix(link.firstSeenAt)}:R>`,
                `Last Seen: <t:${toUnix(link.lastSeenAt)}:R>`,
              ].join("\n"),
            )
            .join("\n\n");

    const extra =
      links.length > 10
        ? `\n\n...and ${links.length - 10} more linked accounts.`
        : "";

    const embed = new EmbedBuilder()
      .setTitle("Verification Investigation")
      .setDescription(`${user}\n\`${user.id}\``)
      .addFields(
        {
          name: "Verification",
          value: accountSummary,
        },
        {
          name: `Linked Accounts (${links.length})`,
          value: `${relationshipSummary}${extra}`,
        },
      )
      .setColor(0x5865f2)
      .setTimestamp();

    await interaction.editReply({
      embeds: [embed],
    });
  });

function toUnix(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

function formatSessionStatus(
  status: "PENDING" | "VERIFIED" | "REJECTED" | "EXPIRED" | null,
): string {
  if (status === null) {
    return "None";
  }

  return status
    .toLowerCase()
    .replace(/^./, (character) => character.toUpperCase());
}

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
