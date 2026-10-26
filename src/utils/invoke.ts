import { Buffer } from "node:buffer";
import type Command from "#cmd-classes/command.js";
import logger from "./logger.ts";
import { clean } from "./misc.ts";

/**
 * Runs a command and sends its result or error.
 */
export async function invokeCommand(command: Command) {
  const args = command.interaction ? JSON.stringify(command.interaction.data.options.raw) : `"${command.content}"`;
  try {
    const startTime = Date.now();
    const result = await command.run();
    const tookLong = Date.now() - startTime >= 180000;

    const ephemeral =
      !command.success ||
      (command.constructor as typeof Command).ephemeral ||
      command.interaction?.data.options.getBoolean("ephemeral", false);

    let res;
    if (typeof result === "string") {
      res = await command.reply(
        { content: result },
        {
          ephemeral,
          mention: true,
        },
      );
    } else if (typeof result === "object") {
      res = await command.reply(result, {
        ephemeral,
        mention: tookLong,
      });
    } else {
      logger.debug(`Unknown return type for command ${command.cmdName}: ${result} (${typeof result})`);
    }

    await command.finalize(res);
  } catch (e) {
    const error = e as Error;
    logger.error(
      `Error occurred in ${command.type} command ${command.cmdName} with arguments ${args}: ${error.stack || error}`,
    );
    try {
      await command.reply({
        content: `${command.getString("error")} <https://github.com/esmBot/esmBot/issues>`,
        files: [
          {
            contents: Buffer.from(clean(error, command.interaction ? [command.interaction.token] : [])),
            name: "error.txt",
          },
        ],
        components: [
          {
            type: 1,
            components: [
              {
                type: 2,
                label: command.getString("support"),
                style: 5,
                url: "https://discord.gg/esmbot-support-592399417676529688",
              },
            ],
          },
        ],
      });
    } catch (err) {
      logger.error(
        `While attempting to send the previous error message, another error occurred: ${(err as Error).stack || err}`,
      );
    }
  } finally {
    if (command.database) {
      await command.database.addCount(command.interaction?.data.name ?? command.cmdName.split(" ")[0]);
    }
  }
}
