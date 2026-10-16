import process from "node:process";
import type { AnyInteractionGateway } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { collectors, commands, messageCommands, userCommands } from "#utils/collections.js";
import { getString } from "#utils/i18n.js";
import { invokeCommand } from "#utils/invoke.js";
import logger from "#utils/logger.js";
import type { EventParams } from "#utils/types.js";

/**
 * Runs when a slash command/interaction is executed.
 */
export default async ({ client, database }: EventParams, interaction: AnyInteractionGateway) => {
  // block if client is not ready yet
  if (!client.ready) return;

  // handle incoming non-command interactions
  if (interaction.isComponentInteraction() || interaction.isModalSubmitInteraction()) {
    const collector = collectors.get(interaction.message!.id);
    if (collector) collector.emit("interaction", interaction);
    return;
  }

  // block other non-command events
  if (!interaction.isCommandInteraction()) return;

  // check if command exists and if it's enabled
  const cmdBaseName = interaction.data.name;
  let cmdName = cmdBaseName;
  const sub = interaction.data.options.getSubCommand();
  if (sub) sub.map((v) => (cmdName += ` ${v}`));
  const cmdBase = commands.get(cmdName) ?? messageCommands.get(cmdName) ?? userCommands.get(cmdName);
  if (!cmdBase) return;

  const cmd = cmdBase as typeof Command;
  if (!(cmd.prototype instanceof Command)) return;

  try {
    await interaction.defer(cmd.ephemeral || interaction.data.options.getBoolean("ephemeral", false) ? 64 : undefined);
  } catch (e) {
    logger.warn(`Could not defer interaction, cannot continue further: ${e}`);
    return;
  }

  if (cmd.dbRequired && !database) {
    await interaction.createFollowup({ content: getString("noDatabase", { locale: interaction.locale }), flags: 64 });
    return;
  }

  const invoker = interaction.member ?? interaction.user;

  // actually run the command
  if (!process.env.DISABLE_CMD_LOG || process.env.DISABLE_CMD_LOG !== "true") {
    logger.log("main", `${invoker.username} (${invoker.id}) ran application command ${cmdName}`);
  }

  await invokeCommand(new cmd(client, database, { type: "application", interaction }));
};
