import process from "node:process";
import type { AnyInteraction } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { collectors, commands, messageCommands, userCommands } from "#utils/collections.js";
import { getString } from "#utils/i18n.js";
import { invokeCommand } from "#utils/invoke.js";
import logger from "#utils/logger.js";
import type { EventParams } from "#utils/types.js";

/**
 * Runs when a slash command/interaction is executed.
 */
export default async ({ client, database, res }: EventParams, interaction: AnyInteraction) => {
  // respond to pings
  if (interaction.isPingInteraction()) {
    if (res) {
      return {
        type: 1,
      };
    }
    await interaction.pong();
    return;
  }

  // block if client is not ready yet
  if (!client.ready) return;

  // handle incoming non-command interactions
  if (interaction.isComponentInteraction() || interaction.isModalSubmitInteraction()) {
    const collector = collectors.get(interaction.message!.id);
    if (collector) collector.emit("interaction", interaction, res);
    return;
  }

  // block other non-command events
  if (!interaction.isCommandInteraction()) {
    logger.debug(`Received unknown interaction of type ${interaction.type}`);
    if (res) {
      res.statusCode = 400;
      res.end("Unknown interaction type");
    }
    return;
  }

  // check if command exists and if it's enabled
  const cmdBaseName = interaction.data.name;
  let cmdName = cmdBaseName;
  const sub = interaction.data.options.getSubCommand();
  if (sub) sub.map((v) => (cmdName += ` ${v}`));
  const cmdBase = commands.get(cmdName) ?? messageCommands.get(cmdName) ?? userCommands.get(cmdName);
  if (!cmdBase) return;

  const cmd = cmdBase as typeof Command;
  if (!(cmd.prototype instanceof Command)) return;

  if (cmd.dbRequired && !database) {
    const payload = { content: getString("noDatabase", { locale: interaction.locale }), flags: 64 };
    if (res) {
      return {
        type: 4,
        data: payload,
      };
    }
    await interaction.createMessage(payload);
    return;
  }

  const invoker = interaction.member ?? interaction.user;

  // actually run the command
  if (!process.env.DISABLE_CMD_LOG || process.env.DISABLE_CMD_LOG !== "true") {
    logger.log("main", `${invoker.username} (${invoker.id}) ran application command ${cmdName}`);
  }

  await invokeCommand(new cmd(client, database, { type: "application", interaction, res }));
};
