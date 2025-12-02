import { Buffer } from "node:buffer";
import process from "node:process";
import type { AnyInteractionGateway } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import MediaCommand from "#cmd-classes/mediaCommand.js";
import { collectors, commands, messageCommands, selectedImages, userCommands } from "#utils/collections.js";
import detectRuntime from "#utils/detectRuntime.js";
import { getString } from "#utils/i18n.js";
import logger from "#utils/logger.js";
import { clean } from "#utils/misc.js";
import { upload } from "#utils/tempimages.js";
import type { EventParams } from "#utils/types.js";

let Sentry: typeof import("@sentry/node");
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "") {
  Sentry = await import(`@sentry/${detectRuntime().type}`);
}

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
  const cmdBase = commands.get(cmdBaseName) ?? messageCommands.get(cmdBaseName) ?? userCommands.get(cmdBaseName);
  if (!cmdBase) return;

  let command = cmdBaseName;
  let cmd = cmdBase.default as typeof Command;
  if (!(cmd.prototype instanceof Command)) return;

  const sub = interaction.data.options.getSubCommand();
  if (sub && cmdBase[sub[0]]?.prototype instanceof Command) {
    cmd = cmdBase[sub[0]] as typeof Command;
    command = `${command} ${sub[0]}`;
  }

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
  logger.log("main", `${invoker.username} (${invoker.id}) ran application command ${command}`);
  try {
    const commandClass = new cmd(client, database, { type: "application", interaction });
    const result = await commandClass.run();
    if (typeof result === "string") {
      await interaction.createFollowup({
        content: result,
        flags: commandClass.success ? 0 : 64,
      });
    } else if (typeof result === "object") {
      if (commandClass instanceof MediaCommand && result.files) {
        const fileSize = interaction.attachmentSizeLimit;
        const file = result.files[0];
        if (file.contents.length > fileSize) {
          if (process.env.TEMPDIR && process.env.TEMPDIR !== "" && interaction.appPermissions.has("EMBED_LINKS")) {
            await upload(
              client,
              { ...file, flags: result.flags },
              interaction,
              commandClass.success,
              interaction.authorizingIntegrationOwners[0] === undefined,
            );
          } else {
            await interaction.createFollowup({
              content: getString("image.noTempServer", { locale: interaction.locale }),
              flags: 64,
            });
          }
        } else {
          const imgMessage = await interaction.createFollowup({
            flags: result.flags ?? (commandClass.success ? 0 : 64),
            files: [file],
          });
          if (interaction.authorizingIntegrationOwners[0] === undefined) {
            const attachment = imgMessage.message.attachments.first();
            if (attachment) {
              const path = new URL(attachment.proxyURL);
              path.searchParams.set("animated", "true");
              selectedImages.set(interaction.user.id, {
                url: attachment.url,
                path: path.toString(),
                name: attachment.filename,
                type: attachment.contentType,
                spoiler: attachment.filename.startsWith("SPOILER_"),
              });
            }
          }
        }
      } else {
        await interaction.createFollowup(
          Object.assign(
            {
              flags: result.flags ?? (commandClass.success ? 0 : 64),
            },
            result,
          ),
        );
      }
    } else {
      logger.debug(`Unknown return type for command ${command}: ${result} (${typeof result})`);
      if (!result) return;
      await interaction.createFollowup(
        Object.assign(
          {
            flags: commandClass.success ? 0 : 64,
          },
          result,
        ),
      );
    }
  } catch (e) {
    const error = e as Error;
    if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "")
      Sentry.captureException(error, {
        tags: {
          process: process.env.pm_id ? Number.parseInt(process.env.pm_id) - 1 : 0,
          command,
          args: JSON.stringify(interaction.data.options.raw),
        },
      });
    if (error.toString().includes("Request entity too large")) {
      await interaction.createFollowup({
        content: getString("image.tooLarge", { locale: interaction.locale }),
        flags: 64,
      });
    } else if (error.toString().includes("Job ended prematurely")) {
      await interaction.createFollowup({
        content: getString("image.jobEnded", { locale: interaction.locale }),
        flags: 64,
      });
    } else {
      logger.error(
        `Error occurred with application command ${command} with arguments ${JSON.stringify(interaction.data.options.raw)}: ${(error as Error).stack || error}`,
      );
      try {
        await interaction.createFollowup({
          content: `${getString("error", { locale: interaction.locale })} <https://github.com/esmBot/esmBot/issues>`,
          files: [
            {
              contents: Buffer.from(clean(error, [interaction.token])),
              name: "error.txt",
            },
          ],
        });
      } catch (err) {
        logger.error(
          `While attempting to send the previous error message, another error occurred: ${(err as Error).stack || err}`,
        );
      }
    }
  } finally {
    if (database) {
      await database.addCount(cmdBaseName);
    }
  }
};
