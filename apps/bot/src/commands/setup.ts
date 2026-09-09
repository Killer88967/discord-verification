import { configureGuild } from "@verification/database";
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";

export const setupCommand = {
  data: new SlashCommandBuilder()
    .setName("setup")
    .setDescription("Configure verification for this server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addChannelOption((option) =>
      option
        .setName("channel")
        .setDescription("The channel where users will verify.")
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(true),
    )
    .addRoleOption((option) =>
      option
        .setName("role")
        .setDescription("The role granted after verification.")
        .setRequired(true),
    ),

  async execute(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!interaction.inCachedGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

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
  },
};
