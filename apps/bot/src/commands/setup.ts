import { configureGuild } from "@verification/database";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { Command } from "../types/command/index.js";

export const setupCommand = new Command()
  .name("setup")
  .description("Configure verification for this server.")
  .guildOnly()
  .permissions(PermissionFlagsBits.ManageGuild)
  .channelOption("channel", "The channel where users will verify.", {
    required: true,
    types: [ChannelType.GuildText],
  })
  .roleOption("role", "The role granted after verification.", {
    required: true,
  })
  .execute(async (interaction) => {
    const channel = interaction.options.getChannel("channel", true);
    const role = interaction.options.getRole("role", true);

    if (channel.type !== ChannelType.GuildText) {
      await interaction.reply({
        content: "The verification channel must be a text channel.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const botMember = interaction.guild.members.me;

    if (!botMember) {
      await interaction.reply({
        content: "I could not resolve my server member.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (role.id === interaction.guild.id || role.managed) {
      await interaction.reply({
        content: "That role cannot be used as the verified role.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (!botMember.permissions.has(PermissionFlagsBits.ManageRoles)) {
      await interaction.reply({
        content:
          "I need the Manage Roles permission to configure verification.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (role.position >= botMember.roles.highest.position) {
      await interaction.reply({
        content: "The verified role must be below my highest role.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    const permissions = channel.permissionsFor(botMember);

    if (
      !permissions?.has([
        PermissionFlagsBits.ViewChannel,
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.EmbedLinks,
      ])
    ) {
      await interaction.reply({
        content:
          "I need View Channel, Send Messages, and Embed Links permissions in that channel.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    await interaction.deferReply({
      flags: MessageFlags.Ephemeral,
    });

    await configureGuild({
      guildId: interaction.guild.id,
      guildName: interaction.guild.name,
      verifiedRoleId: role.id,
      verificationChannelId: channel.id,
    });

    const embed = new EmbedBuilder()
      .setTitle("Verification")
      .setDescription(
        [
          "Verify your account to gain access to the server.",
          "",
          "Click the button below to begin.",
        ].join("\n"),
      )
      .setColor(0x5865f2);

    const button = new ButtonBuilder()
      .setCustomId("verification:start")
      .setLabel("Verify")
      .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    await channel.send({
      embeds: [embed],
      components: [row],
    });

    await interaction.editReply({
      content: [
        "Verification has been configured.",
        "",
        `Channel: ${channel}`,
        `Role: ${role}`,
      ].join("\n"),
    });
  });
