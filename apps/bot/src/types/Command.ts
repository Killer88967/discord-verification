import {
  type ChatInputCommandInteraction,
  ChannelType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";

type CommandHandler<TGuildOnly extends boolean> = (
  interaction: TGuildOnly extends true
    ? ChatInputCommandInteraction<"cached">
    : ChatInputCommandInteraction,
) => Promise<void>;

type GuildCommandChannelType =
  | ChannelType.GuildText
  | ChannelType.GuildVoice
  | ChannelType.GuildCategory
  | ChannelType.GuildAnnouncement
  | ChannelType.AnnouncementThread
  | ChannelType.PublicThread
  | ChannelType.PrivateThread
  | ChannelType.GuildStageVoice
  | ChannelType.GuildForum
  | ChannelType.GuildMedia;

interface CommandOptionSettings {
  required?: boolean;
}

interface ChannelOptionSettings extends CommandOptionSettings {
  types?: GuildCommandChannelType[];
}

interface DeferSettings {
  ephemeral?: boolean;
}

export class Command<TGuildOnly extends boolean = false> {
  public readonly data = new SlashCommandBuilder();

  private handler?: (interaction: ChatInputCommandInteraction) => Promise<void>;

  private guildOnlyValue = false;
  private deferSettings?: DeferSettings;

  public name(value: string): this {
    this.data.setName(value);

    return this;
  }

  public description(value: string): this {
    this.data.setDescription(value);

    return this;
  }

  public guildOnly(): Command<true> {
    this.guildOnlyValue = true;

    return this as unknown as Command<true>;
  }

  public permissions(value: bigint | number): this {
    this.data.setDefaultMemberPermissions(value);

    return this;
  }

  public ephemeral(value = true): this {
    this.deferSettings = {
      ...(this.deferSettings ?? {}),
      ephemeral: value,
    };

    return this;
  }

  public defer(settings: DeferSettings = {}): this {
    this.deferSettings = settings;

    return this;
  }

  public userOption(
    name: string,
    description: string,
    settings: CommandOptionSettings = {},
  ): this {
    this.data.addUserOption((option) =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false),
    );

    return this;
  }

  public roleOption(
    name: string,
    description: string,
    settings: CommandOptionSettings = {},
  ): this {
    this.data.addRoleOption((option) =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false),
    );

    return this;
  }

  public channelOption(
    name: string,
    description: string,
    settings: ChannelOptionSettings = {},
  ): this {
    this.data.addChannelOption((option) => {
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false);

      if (settings.types?.length) {
        option.addChannelTypes(...settings.types);
      }

      return option;
    });

    return this;
  }

  public execute(handler: CommandHandler<TGuildOnly>): this {
    this.handler = handler as (
      interaction: ChatInputCommandInteraction,
    ) => Promise<void>;

    return this;
  }

  public async run(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.handler) {
      throw new Error(
        `Command ${this.data.name || "unknown"} has no execute handler.`,
      );
    }

    if (this.guildOnlyValue && !interaction.inCachedGuild()) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });

      return;
    }

    if (this.deferSettings) {
      await interaction.deferReply({
        flags: this.deferSettings.ephemeral
          ? MessageFlags.Ephemeral
          : undefined,
      });
    }

    await this.handler(interaction);
  }
}
