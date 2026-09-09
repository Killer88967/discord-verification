import { SlashCommandSubcommandBuilder } from "discord.js";
import type {
  ChannelOptionSettings,
  CommandOptionSettings,
  IntegerOptionSettings,
  NumberOptionSettings,
  StringOptionSettings,
} from "./CommandOptions.js";

export class Subcommand {
  public readonly data = new SlashCommandSubcommandBuilder();

  public name(value: string): this {
    this.data.setName(value);

    return this;
  }

  public description(value: string): this {
    this.data.setDescription(value);

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

  public stringOption(
    name: string,
    description: string,
    settings: StringOptionSettings = {},
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

  public integerOption(
    name: string,
    description: string,
    settings: IntegerOptionSettings = {},
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
   * Adds a Discord role option.
   */
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

  /**
   * Adds a Discord channel option.
   */
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

  /**
   * Adds a numeric option.
   */
  public numberOption(
    name: string,
    description: string,
    settings: NumberOptionSettings = {},
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
    settings: CommandOptionSettings = {},
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
   */
  public mentionableOption(
    name: string,
    description: string,
    settings: CommandOptionSettings = {},
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
    settings: CommandOptionSettings = {},
  ): this {
    this.data.addAttachmentOption((option) =>
      option
        .setName(name)
        .setDescription(description)
        .setRequired(settings.required ?? false),
    );

    return this;
  }
}
