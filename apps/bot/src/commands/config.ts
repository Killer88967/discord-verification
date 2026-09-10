import {
  getGuildSecurityPolicy,
  updateGuildSecurityPolicy,
} from "@verification/database";
import { EmbedBuilder, PermissionFlagsBits } from "discord.js";
import { Command } from "../types/command/Command.js";

export const configCommand = new Command()
  .name("config")
  .description("Configure verification settings.")
  .guildOnly()
  .permissions(PermissionFlagsBits.ManageGuild)
  .ephemeral()
  .subcommand((subcommand) =>
    subcommand
      .name("security")
      .description("Configure verification security settings.")
      .integerOption(
        "minimum-account-age",
        "Minimum Discord account age in days.",
        {
          min: 0,
          max: 3650,
        },
      )
      .integerOption(
        "risk-threshold",
        "Risk score required to trigger the configured action.",
        {
          min: 0,
          max: 100,
        },
      )
      .stringOption(
        "risk-action",
        "Action to take when the risk threshold is reached.",
        {
          choices: [
            {
              name: "None",
              value: "NONE",
            },
            {
              name: "Reject Verification",
              value: "REJECT",
            },
            {
              name: "Kick",
              value: "KICK",
            },
            {
              name: "Ban",
              value: "BAN",
            },
          ],
        },
      ),
  )
  .execute(async (interaction) => {
    const subcommand = interaction.options.getSubcommand();

    if (subcommand !== "security") {
      await interaction.editReply({
        content: "Unknown configuration subcommand.",
      });

      return;
    }

    const minimumAccountAgeDays = interaction.options.getInteger(
      "minimum-account-age",
    );

    const riskThreshold = interaction.options.getInteger("risk-threshold");

    const riskAction = interaction.options.getString("risk-action");

    const hasUpdates =
      minimumAccountAgeDays !== null ||
      riskThreshold !== null ||
      riskAction !== null;

    if (!hasUpdates) {
      const policy = await getGuildSecurityPolicy(interaction.guild.id);

      if (!policy) {
        await interaction.editReply({
          content: "Verification has not been configured for this server yet.",
        });

        return;
      }

      const embed = new EmbedBuilder()
        .setTitle("Verification Security")
        .addFields(
          {
            name: "Minimum Account Age",
            value:
              policy.minimumAccountAgeDays === 0
                ? "Disabled"
                : `${policy.minimumAccountAgeDays} days`,
            inline: true,
          },
          {
            name: "Risk Threshold",
            value: `${policy.riskThreshold}/100`,
            inline: true,
          },
          {
            name: "Risk Action",
            value: formatRiskAction(policy.riskAction),
            inline: true,
          },
        )
        .setColor(0x5865f2);

      await interaction.editReply({
        embeds: [embed],
      });

      return;
    }

    const policy = await updateGuildSecurityPolicy({
      guildId: interaction.guild.id,
      ...(minimumAccountAgeDays !== null
        ? {
            minimumAccountAgeDays,
          }
        : {}),
      ...(riskThreshold !== null
        ? {
            riskThreshold,
          }
        : {}),
      ...(riskAction !== null
        ? {
            riskAction: parseRiskAction(riskAction),
          }
        : {}),
    });

    const embed = new EmbedBuilder()
      .setTitle("Verification Security Updated")
      .addFields(
        {
          name: "Minimum Account Age",
          value:
            policy.minimumAccountAgeDays === 0
              ? "Disabled"
              : `${policy.minimumAccountAgeDays} days`,
          inline: true,
        },
        {
          name: "Risk Threshold",
          value: `${policy.riskThreshold}/100`,
          inline: true,
        },
        {
          name: "Risk Action",
          value: formatRiskAction(policy.riskAction),
          inline: true,
        },
      )
      .setColor(0x57f287);

    await interaction.editReply({
      embeds: [embed],
    });
  });

function parseRiskAction(value: string): "NONE" | "REJECT" | "KICK" | "BAN" {
  switch (value) {
    case "NONE":
    case "REJECT":
    case "KICK":
    case "BAN":
      return value;

    default:
      throw new Error(`Unknown verification risk action: ${value}`);
  }
}

function formatRiskAction(action: "NONE" | "REJECT" | "KICK" | "BAN"): string {
  switch (action) {
    case "NONE":
      return "None";

    case "REJECT":
      return "Reject Verification";

    case "KICK":
      return "Kick";

    case "BAN":
      return "Ban";
  }
}
