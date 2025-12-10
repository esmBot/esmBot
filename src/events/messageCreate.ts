import { Buffer } from "node:buffer";
import process from "node:process";
import { type AnyTextableChannel, GroupChannel, type Message, PrivateChannel, ThreadChannel } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import MediaCommand from "#cmd-classes/mediaCommand.js";
import { aliases, commands, disabledCache, disabledCmdCache, prefixCache } from "#utils/collections.js";
import detectRuntime from "#utils/detectRuntime.js";
import { getString } from "#utils/i18n.js";
import { error as _error, log } from "#utils/logger.js";
import { clean } from "#utils/misc.js";
import parseCommand from "#utils/parseCommand.js";
import { upload } from "#utils/tempimages.js";
import type { DBGuild, EventParams } from "#utils/types.js";

let Sentry: typeof import("@sentry/node");
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "") {
  Sentry = await import(`@sentry/${detectRuntime().type}`);
}

let mentionRegex: RegExp;

/**
 * Runs when someone sends a message.
 */
export default async ({ client, database }: EventParams, message: Message) => {
  // block if client is not ready yet
  if (!client.ready) return;

  // ignore other bots
  if (message.author.bot) return;

  // don't run command if bot can't send messages
  let permChannel: AnyTextableChannel | undefined;
  if (message.channel instanceof ThreadChannel && !message.channel.parent) {
    try {
      permChannel = await client.rest.channels.get<AnyTextableChannel>(message.channel.parentID);
    } catch {
      return;
    }
  } else {
    permChannel = message.channel;
  }
  if (
    message.guildID &&
    !(permChannel instanceof PrivateChannel) &&
    !(permChannel instanceof GroupChannel) &&
    permChannel?.guild.roles.size !== 0 &&
    !permChannel?.permissionsOf(client.user.id).has("SEND_MESSAGES")
  )
    return;

  if (!mentionRegex) mentionRegex = new RegExp(`^<@!?${client.user.id}> `);

  let guildDB: DBGuild | undefined;
  let text: string;
  const defaultPrefix = process.env.PREFIX ?? "&";
  const mentionResult = message.content.match(mentionRegex);
  if (mentionResult) {
    text = message.content.substring(mentionResult[0].length).trim();
  } else if (message.guildID && database) {
    const cachedPrefix = prefixCache.get(message.guildID);
    if (cachedPrefix && message.content.startsWith(cachedPrefix)) {
      text = message.content.substring(cachedPrefix.length).trim();
    } else {
      guildDB = await database.getGuild(message.guildID);
      if (message.content.startsWith(guildDB.prefix)) {
        text = message.content.substring(guildDB.prefix.length).trim();
        prefixCache.set(message.guildID, guildDB.prefix);
      } else {
        return;
      }
    }
  } else if (message.content.startsWith(defaultPrefix)) {
    text = message.content.substring(defaultPrefix.length).trim();
  } else if (!message.guildID) {
    text = message.content;
  } else {
    return;
  }

  // separate commands and args
  const preArgs = text.split(/\s+/g);
  const shifted = preArgs.shift();
  if (!shifted) return;
  const cmdBaseName = shifted.toLowerCase();
  let aliased = aliases.get(cmdBaseName);
  if (aliased?.includes(" ")) {
    const subSplit = aliased.split(" ");
    aliased = subSplit[0];
    preArgs.unshift(...subSplit.slice(1));
  }

  const cmdName = aliased ?? cmdBaseName;

  // check if command exists and if it's enabled
  const cmdBase = commands.get(cmdName);
  if (!cmdBase) return;

  let command = cmdBaseName;
  let cmd = cmdBase.default as typeof Command;
  if (!(cmd.prototype instanceof Command)) return;

  // parse args
  const parsed = parseCommand(preArgs);
  let canon = cmdName;
  const lowerSub = parsed.args[0]?.toLowerCase();
  if (cmdBase[lowerSub]?.prototype instanceof Command) {
    cmd = cmdBase[lowerSub] as typeof Command;
    canon = `${canon} ${lowerSub}`;
    if (!aliased) command = `${command} ${lowerSub}`;
    parsed.args = parsed.args.slice(1);
  }

  if (!cmd) return;

  // block certain commands from running in DMs
  if (!cmd.directAllowed && !message.guildID) return;

  if (cmd.dbRequired && !database) {
    await client.rest.channels.createMessage(message.channelID, {
      content: getString("noDatabase"),
    });
    return;
  }

  // don't run if message is in a disabled channel
  if (message.guildID && database) {
    let disabled = disabledCache.get(message.guildID);
    if (!disabled) {
      if (!guildDB) guildDB = await database.getGuild(message.guildID);
      disabledCache.set(message.guildID, guildDB.disabled);
      disabled = guildDB.disabled;
    }
    if (disabled.includes(message.channelID) && command !== "channel") return;

    let disabledCmds = disabledCmdCache.get(message.guildID);
    if (!disabledCmds) {
      if (!guildDB) guildDB = await database.getGuild(message.guildID);
      disabledCmdCache.set(message.guildID, guildDB.disabled_commands);
      disabledCmds = guildDB.disabled_commands;
    }
    if (disabledCmds.includes(command) || disabledCmds.includes(cmdName) || disabledCmds.includes(canon)) return;
  }

  // actually run the command
  log("log", `${message.author.username} (${message.author.id}) ran classic command ${command}`);
  const reference = {
    messageReference: {
      channelID: message.channelID,
      messageID: message.id,
      guildID: message.guildID ?? undefined,
      failIfNotExists: false,
    },
    allowedMentions: {
      repliedUser: false,
    },
  };
  try {
    const startTime = new Date();
    const commandClass = new cmd(client, database, {
      type: "classic",
      cmdName: canon,
      message,
      args: parsed.args,
      content: text.replace(command, "").trim(), // we also provide the message content as a parameter for cases where we need more accuracy
      specialArgs: parsed.flags,
    });
    const result = await commandClass.run();
    const endTime = new Date();
    if (endTime.getTime() - startTime.getTime() >= 180000) reference.allowedMentions.repliedUser = true;
    if (typeof result === "string") {
      reference.allowedMentions.repliedUser = true;
      await client.rest.channels.createMessage(
        message.channelID,
        Object.assign(
          {
            content: result,
          },
          reference,
        ),
      );
    } else if (typeof result === "object") {
      if (commandClass instanceof MediaCommand && result.files) {
        let fileSize = 10485760;
        if (message.guild) {
          switch (message.guild.premiumTier) {
            case 2:
              fileSize = 52428800;
              break;
            case 3:
              fileSize = 104857600;
              break;
          }
        }
        const file = result.files[0];
        if (file.contents.length > fileSize) {
          if (process.env.TEMPDIR && process.env.TEMPDIR !== "" && commandClass.permissions.has("EMBED_LINKS")) {
            await upload(client, { ...file, flags: result.flags }, message);
          } else {
            await client.rest.channels.createMessage(message.channelID, {
              content: getString("image.noTempServer"),
            });
          }
        } else {
          await client.rest.channels.createMessage(
            message.channelID,
            Object.assign(
              {
                files: [file],
              },
              reference,
            ),
          );
        }
      } else {
        await client.rest.channels.createMessage(message.channelID, Object.assign(result, reference));
      }
    }
  } catch (e) {
    const error = e as Error;
    if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "")
      Sentry.captureException(error, {
        tags: {
          process: process.env.pm_id ? Number.parseInt(process.env.pm_id) - 1 : 0,
          command,
          args: JSON.stringify(preArgs),
        },
      });
    if (error.toString().includes("Request entity too large")) {
      await client.rest.channels.createMessage(
        message.channelID,
        Object.assign(
          {
            content: getString("image.tooLarge"),
          },
          reference,
        ),
      );
    } else if (error.toString().includes("Job ended prematurely")) {
      await client.rest.channels.createMessage(
        message.channelID,
        Object.assign(
          {
            content: getString("image.jobEnded"),
          },
          reference,
        ),
      );
    } else if (error.toString().includes("Timed out")) {
      await client.rest.channels.createMessage(
        message.channelID,
        Object.assign(
          {
            content: getString("image.timeoutDownload"),
          },
          reference,
        ),
      );
    } else {
      _error(`Error occurred with command message ${message.content}: ${(error as Error).stack || error}`);
      try {
        await client.rest.channels.createMessage(
          message.channelID,
          Object.assign(
            {
              content: `${getString("error")} <https://github.com/esmBot/esmBot/issues>`,
              files: [
                {
                  contents: Buffer.from(clean(error)),
                  name: "error.txt",
                },
              ],
              components: [
                {
                  type: 1,
                  components: [
                    {
                      type: 2,
                      label: getString("support"),
                      style: 5,
                      url: "https://discord.gg/esmbot-support-592399417676529688",
                    },
                  ],
                },
              ],
            },
            reference,
          ),
        );
      } catch (err) {
        _error(
          `While attempting to send the previous error message, another error occurred: ${(err as Error).stack || err}`,
        );
      }
    }
  } finally {
    if (database) {
      await database.addCount(cmdName);
    }
  }
};
