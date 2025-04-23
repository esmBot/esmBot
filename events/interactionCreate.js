import database from "#database";
import logger from "#utils/logger.js";
import { collectors, commands, messageCommands, userCommands } from "#utils/collections.js";
import { clean } from "#utils/misc.js";
import { upload } from "#utils/tempimages.js";
import { InteractionTypes } from "oceanic.js";
import { getString } from "#utils/i18n.js";

let Sentry;
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "") {
  Sentry = await import("@sentry/node");
}

/**
 * Runs when a slash command/interaction is executed.
 * @param {import("oceanic.js").Client} client
 * @param {import("oceanic.js").AnyInteractionGateway} interaction
 */
export default async (client, interaction) => {
  // block if client is not ready yet
  if (!client.ready) return;

  // handle incoming non-command interactions
  if (interaction.type === InteractionTypes.MESSAGE_COMPONENT) {
    //await interaction.deferUpdate();
    const collector = collectors.get(interaction.message.id);
    if (collector) collector.emit("interaction", interaction);
    return;
  }

  // block other non-command events
  if (interaction.type !== InteractionTypes.APPLICATION_COMMAND) return;

  // check if command exists and if it's enabled
  const command = interaction.data.name;
  const cmd = commands.get(command) ?? messageCommands.get(command) ?? userCommands.get(command);
  if (!cmd) return;

  try {
    await interaction.defer((cmd.ephemeral || interaction.data.options.getBoolean("ephemeral", false)) ? 64 : undefined);
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
  logger.log("main", `${invoker.username} (${invoker.id}) ran application command ${command}`);
  try {
    const commandClass = new cmd(client, { type: "application", interaction });
    const result = await commandClass.run();
    const replyMethod = commandClass.edit ? "editOriginal" : "createFollowup";
    if (typeof result === "string") {
      await interaction[replyMethod]({
        content: result,
        flags: commandClass.success ? 0 : 64
      });
    } else if (typeof result === "object") {
      if (result.contents && result.name) {
        const fileSize = interaction.attachmentSizeLimit;
        if (result.contents.length > fileSize) {
          if (process.env.TEMPDIR && process.env.TEMPDIR !== "" && interaction.appPermissions.has("EMBED_LINKS")) {
            await upload(client, result, interaction, commandClass.success, true);
          } else {
            await interaction[replyMethod]({
              content: getString("image.noTempServer", { locale: interaction.locale }),
              flags: 64
            });
          }
        } else {
          await interaction[replyMethod]({
            flags: result.flags ?? (commandClass.success ? 0 : 64),
            files: [result]
          });
        }
      } else {
        await interaction[replyMethod](Object.assign({
          flags: result.flags ?? (commandClass.success ? 0 : 64)
        }, result));
      }
    } else {
      logger.debug(`Unknown return type for command ${command}: ${result} (${typeof result})`);
      if (!result) return;
      await interaction[replyMethod](Object.assign({
        flags: commandClass.success ? 0 : 64
      }, result));
    }
  } catch (error) {
    if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "") Sentry.captureException(error, {
      tags: {
        process: process.env.pm_id ? Number.parseInt(process.env.pm_id) - 1 : 0,
        command,
        args: JSON.stringify(interaction.data.options.raw)
      }
    });
    if (error.toString().includes("Request entity too large")) {
      await interaction.createFollowup({ content: getString("image.tooLarge", { locale: interaction.locale }), flags: 64 });
    } else if (error.toString().includes("Job ended prematurely")) {
      await interaction.createFollowup({ content: getString("image.jobEnded", { locale: interaction.locale }), flags: 64 });
    } else {
      logger.error(`Error occurred with application command ${command} with arguments ${JSON.stringify(interaction.data.options.raw)}: ${error.stack || error}`);
      try {
        let err = error;
        if (error?.constructor?.name === "Promise") err = await error;
        await interaction.createFollowup({
          content: `${getString("error", { locale: interaction.locale })} <https://github.com/esmBot/esmBot/issues>`,
          files: [{
            contents: Buffer.from(clean(err)),
            name: "error.txt"
          }]
        });
      } catch (e) {
        logger.error(`While attempting to send the previous error message, another error occurred: ${e.stack || e}`);
      }
    }
  } finally {
    if (database) {
      await database.addCount(command);
    }
  }
};
