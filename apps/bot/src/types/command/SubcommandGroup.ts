import { SlashCommandSubcommandGroupBuilder } from "discord.js";
import { Subcommand } from "./Subcommand.js";

/**
 * Fluent builder for Discord slash-command subcommand groups.
 *
 * @example
 * ```ts
 * new SubcommandGroup()
 *   .name("verification")
 *   .description("Manage verification settings.")
 *   .subcommand((subcommand) =>
 *     subcommand
 *       .name("role")
 *       .description("Configure the verified role."),
 *   );
 * ```
 */
export class SubcommandGroup {
  /**
   * Underlying Discord.js subcommand-group builder.
   */
  public readonly data = new SlashCommandSubcommandGroupBuilder();

  /**
   * Sets the subcommand-group name.
   */
  public name(value: string): this {
    this.data.setName(value);

    return this;
  }

  /**
   * Sets the subcommand-group description.
   */
  public description(value: string): this {
    this.data.setDescription(value);

    return this;
  }

  /**
   * Adds a subcommand to this group.
   */
  public subcommand(build: (subcommand: Subcommand) => Subcommand): this {
    const subcommand = build(new Subcommand());

    this.data.addSubcommand(subcommand.data);

    return this;
  }
}
