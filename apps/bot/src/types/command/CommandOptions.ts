import { ChannelType } from "discord.js";

/**
 * Channel types Discord allows within slash-command channel options.
 */
export type GuildCommandChannelType =
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

/**
 * Shared configuration for slash-command options.
 */
export interface CommandOptionSettings {
  /**
   * Whether the option must be supplied.
   *
   * @default false
   */
  required?: boolean;
}

/**
 * Configuration for string command options.
 */
export interface StringOptionSettings extends CommandOptionSettings {
  /**
   * Minimum accepted string length.
   */
  minLength?: number;

  /**
   * Maximum accepted string length.
   */
  maxLength?: number;

  /**
   * Enables Discord autocomplete for this option.
   *
   * Cannot be combined with static choices.
   *
   * @default false
   */
  autocomplete?: boolean;

  /**
   * Static choices displayed by Discord.
   */
  choices?: readonly {
    name: string;
    value: string;
  }[];
}

/**
 * Configuration for integer command options.
 */
export interface IntegerOptionSettings extends CommandOptionSettings {
  min?: number;
  max?: number;
  autocomplete?: boolean;

  choices?: readonly {
    name: string;
    value: number;
  }[];
}

/**
 * Configuration for number command options.
 */
export interface NumberOptionSettings extends CommandOptionSettings {
  min?: number;
  max?: number;
  autocomplete?: boolean;

  choices?: readonly {
    name: string;
    value: number;
  }[];
}

/**
 * Configuration for channel command options.
 */
export interface ChannelOptionSettings extends CommandOptionSettings {
  /**
   * Restricts the option to specific Discord channel types.
   */
  types?: GuildCommandChannelType[];
}

/**
 * Automatic interaction deferral configuration.
 */
export interface DeferSettings {
  /**
   * Whether the deferred response should only be visible to the command user.
   *
   * @default false
   */
  ephemeral?: boolean;
}
