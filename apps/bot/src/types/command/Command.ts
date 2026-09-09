import {
  ApplicationIntegrationType,
  type AutocompleteInteraction,
  type ChatInputCommandInteraction,
  type LocalizationMap,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import * as COptions from "./CommandOptions.js";
import { SubcommandGroup } from "./SubcommandGroup.js";
import { Subcommand } from "./Subcommand.js";

/**
 * Function executed when a slash command is invoked.
 *
 * Guild-only commands receive a cached guild interaction, allowing direct
 * access to properties such as `interaction.guild`.
 */
export type CommandHandler<TGuildOnly extends boolean> = (
  interaction: TGuildOnly extends true
    ? ChatInputCommandInteraction<"cached">
    : ChatInputCommandInteraction,
) => Promise<void>;

/**
 * Function executed when Discord requests autocomplete results.
 */
export type AutocompleteHandler = (
  interaction: AutocompleteInteraction,
) => Promise<void>;

/**
 * Fluent builder used to define and execute Discord slash commands.
 *
 * @example
 * ```ts
 * export const checkCommand = new Command()
 *   .name("check")
 *   .description("Check a user.")
 *   .guildOnly()
 *   .permissions(PermissionFlagsBits.ModerateMembers)
 *   .ephemeral()
 *   .userOption("user", "User to check.", {
 *     required: true,
 *   })
 *   .execute(async (interaction) => {
 *     const user = interaction.options.getUser("user", true);
 *   });
 * ```
 */
export class Command<TGuildOnly extends boolean = false> {
  /**
   * Underlying Discord.js slash-command builder.
   *
   * Used during application-command registration.
   */
  public readonly data = new SlashCommandBuilder();

  private handler?: (interaction: ChatInputCommandInteraction) => Promise<void>;

  private autocompleteHandler?: AutocompleteHandler;

  private guildOnlyValue = false;
  private deferSettings?: COptions.DeferSettings;

  /**
   * Sets the slash-command name.
   */
  public name(value: string): this {
    this.data.setName(value);

    return this;
  }

  /**
   * Sets the slash-command description.
   */
  public description(value: string): this {
    this.data.setDescription(value);

    return this;
  }

  /**
   * Marks this command as guild-only.
   *
   * The execute callback will receive a cached guild interaction, allowing
   * TypeScript to safely expose `interaction.guild`.
   */
  public guildOnly(): Command<true> {
    this.guildOnlyValue = true;
    this.data.setContexts(InteractionContextType.Guild);

    return this as unknown as Command<true>;
  }

  /**
   * Sets the permissions required for this command by default.
   */
  public permissions(value: bigint | number): this {
    this.data.setDefaultMemberPermissions(value);

    return this;
  }

  /**
   * Prevents the command from being usable in DMs.
   *
   * This affects Discord command registration rather than runtime execution.
   *
   * @deprecated
   */
  public dmPermission(value: boolean): this {
    this.data.setDMPermission(value);

    return this;
  }

  /**
   * Restricts the contexts where Discord exposes this command.
   */
  public contexts(...contexts: InteractionContextType[]): this {
    this.data.setContexts(...contexts);

    return this;
  }

  /**
   * Restricts which application installation types expose this command.
   */
  public integrationTypes(...types: ApplicationIntegrationType[]): this {
    this.data.setIntegrationTypes(...types);

    return this;
  }

  /**
   * Marks the command as age-restricted.
   */
  public nsfw(value = true): this {
    this.data.setNSFW(value);

    return this;
  }

  /**
   * Sets localized command names.
   */
  public nameLocalizations(values: LocalizationMap | null): this {
    this.data.setNameLocalizations(values);

    return this;
  }

  /**
   * Sets localized command descriptions.
   */
  public descriptionLocalizations(values: LocalizationMap | null): this {
    this.data.setDescriptionLocalizations(values);

    return this;
  }

  /**
   * Automatically defers the command response.
   */
  public defer(settings: COptions.DeferSettings = {}): this {
    this.deferSettings = settings;

    return this;
  }

  /**
   * Automatically defers the command with an ephemeral response.
   *
   * Equivalent to:
   *
   * ```ts
   * .defer({
   *   ephemeral: true,
   * })
   * ```
   */
  public ephemeral(value = true): this {
    this.deferSettings = {
      ...(this.deferSettings ?? {}),
      ephemeral: value,
    };

    return this;
  }

  /**
   * Adds a Discord user option.
   */
  public userOption(
    name: string,
    description: string,
    settings: COptions.CommandOptionSettings = {},
  ): this {
    this.data.addUserOption((option) =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false),
    );

    return this;
  }

  /**
   * Adds a Discord role option.
   */
  public roleOption(
    name: string,
    description: string,
    settings: COptions.CommandOptionSettings = {},
  ): this {
    this.data.addRoleOption((option) =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false),
    );

    return this;
  }

  /**
   * Adds a Discord channel option.
   */
  public channelOption(
    name: string,
    description: string,
    settings: COptions.ChannelOptionSettings = {},
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

  /**
   * Adds a string option.
   */
  public stringOption(
    name: string,
    description: string,
    settings: COptions.StringOptionSettings = {},
  ): this {
    this.data.addStringOption((option) => {
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false);

      if (settings.minLength !== undefined) {
        option.setMinLength(settings.minLength);
      }

      if (settings.maxLength !== undefined) {
        option.setMaxLength(settings.maxLength);
      }

      if (settings.autocomplete !== undefined) {
        option.setAutocomplete(settings.autocomplete);
      }

      if (settings.choices?.length) {
        option.addChoices(...settings.choices);
      }

      return option;
    });

    return this;
  }

  /**
   * Adds an integer option.
   */
  public integerOption(
    name: string,
    description: string,
    settings: COptions.IntegerOptionSettings = {},
  ): this {
    this.data.addIntegerOption((option) => {
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false);

      if (settings.min !== undefined) {
        option.setMinValue(settings.min);
      }

      if (settings.max !== undefined) {
        option.setMaxValue(settings.max);
      }

      if (settings.autocomplete !== undefined) {
        option.setAutocomplete(settings.autocomplete);
      }

      if (settings.choices?.length) {
        option.addChoices(...settings.choices);
      }

      return option;
    });

    return this;
  }

  /**
   * Adds a numeric option.
   */
  public numberOption(
    name: string,
    description: string,
    settings: COptions.NumberOptionSettings = {},
  ): this {
    this.data.addNumberOption((option) => {
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false);

      if (settings.min !== undefined) {
        option.setMinValue(settings.min);
      }

      if (settings.max !== undefined) {
        option.setMaxValue(settings.max);
      }

      if (settings.autocomplete !== undefined) {
        option.setAutocomplete(settings.autocomplete);
      }

      if (settings.choices?.length) {
        option.addChoices(...settings.choices);
      }

      return option;
    });

    return this;
  }

  /**
   * Adds a boolean option.
   */
  public booleanOption(
    name: string,
    description: string,
    settings: COptions.CommandOptionSettings = {},
  ): this {
    this.data.addBooleanOption((option) =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false),
    );

    return this;
  }

  /**
   * Adds a mentionable option.
   *
   * Mentionable options accept either users or roles.
   */
  public mentionableOption(
    name: string,
    description: string,
    settings: COptions.CommandOptionSettings = {},
  ): this {
    this.data.addMentionableOption((option) =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false),
    );

    return this;
  }

  /**
   * Adds an attachment option.
   */
  public attachmentOption(
    name: string,
    description: string,
    settings: COptions.CommandOptionSettings = {},
  ): this {
    this.data.addAttachmentOption((option) =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false),
    );

    return this;
  }

  /**
   * Adds a subcommand.
   */
  public subcommand(build: (subcommand: Subcommand) => Subcommand): this {
    const subcommand = build(new Subcommand());

    this.data.addSubcommand(subcommand.data);

    return this;
  }

  /**
   * Adds a subcommand group.
   */
  public subcommandGroup(
    build: (group: SubcommandGroup) => SubcommandGroup,
  ): this {
    const group = build(new SubcommandGroup());

    this.data.addSubcommandGroup(group.data);

    return this;
  }

  /**
   * Registers the callback invoked when this command executes.
   */
  public execute(handler: CommandHandler<TGuildOnly>): this {
    this.handler = handler as (
      interaction: ChatInputCommandInteraction,
    ) => Promise<void>;

    return this;
  }

  /**
   * Registers the autocomplete callback for this command.
   */
  public autocomplete(handler: AutocompleteHandler): this {
    this.autocompleteHandler = handler;

    return this;
  }

  /**
   * Executes the registered command callback.
   *
   * This method is intended to be called by the bot's interaction dispatcher.
   *
   * @throws If no execute callback has been registered.
   */
  public async run(interaction: ChatInputCommandInteraction): Promise<void> {
    if (!this.handler) {
      throw new Error(
        `Command "${this.data.name || "unknown"}" has no execute handler.`,
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

  /**
   * Executes this command's autocomplete callback.
   *
   * @throws If autocomplete was requested but no autocomplete callback exists.
   */
  public async runAutocomplete(
    interaction: AutocompleteInteraction,
  ): Promise<void> {
    if (!this.autocompleteHandler) {
      throw new Error(
        `Command "${this.data.name || "unknown"}" has no autocomplete handler.`,
      );
    }

    await this.autocompleteHandler(interaction);
  }
}
