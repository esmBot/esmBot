import database from "../utils/database.js";
import { log, error as _error } from "../utils/logger.js";
import { prefixCache, aliases, disabledCache, disabledCmdCache, commands } from "../utils/collections.js";
import parseCommand from "../utils/parseCommand.js";
import { clean } from "../utils/misc.js";
import { upload } from "../utils/tempimages.js";
import { GroupChannel, PrivateChannel, ThreadChannel } from "oceanic.js";
import { getString } from "../utils/i18n.js";

let Sentry;
if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "") {
  Sentry = await import("@sentry/node");
}

let mentionRegex;

/**
 * Runs when someone sends a message.
 * @param {import("oceanic.js").Client} client
 * @param {import("oceanic.js").Message} message
 */
export default async (client, message) => {
  // block if client is not ready yet
  if (!client.ready) return;

  // ignore other bots
  if (message.author.bot) return;

  // don't run command if bot can't send messages
  let permChannel;
  if (message.channel instanceof ThreadChannel && !message.channel.parent) {
    try {
      permChannel = await client.rest.channels.get(message.channel.parentID);
    } catch {
      return;
    }
  } else {
    permChannel = message.channel;
  }
  if (message.guildID && (!(permChannel instanceof PrivateChannel) && !(permChannel instanceof GroupChannel)) && !permChannel?.permissionsOf(client.user.id).has("SEND_MESSAGES")) return;

  if (!mentionRegex) mentionRegex = new RegExp(`^<@!?${client.user.id}> `);

  let guildDB;
  let text;
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
  const command = shifted.toLowerCase();
  const aliased = aliases.get(command);

  const cmdName = aliased ?? command;

  // check if command exists and if it's enabled
  const cmd = commands.get(cmdName);
  if (!cmd) return;

  // block certain commands from running in DMs
  if (!cmd.directAllowed && !message.guildID) return;

  if (cmd.dbRequired && !database) {
    await client.rest.channels.createMessage(message.channelID, {
      content: getString("noDatabase")
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
      disabledCmdCache.set(message.guildID, guildDB.disabled_commands ?? guildDB.disabledCommands);
      disabledCmds = guildDB.disabled_commands ?? guildDB.disabledCommands;
    }
    if (disabledCmds.includes(cmdName)) return;
  }

  // actually run the command
  log("log", `${message.author.username} (${message.author.id}) ran classic command ${command}`);
  const reference = {
    messageReference: {
      channelID: message.channelID,
      messageID: message.id,
      guildID: message.guildID ?? undefined,
      failIfNotExists: false
    },
    allowedMentions: {
      repliedUser: false
    }
  };
  try {
    // parse args
    const parsed = parseCommand(preArgs);
    const startTime = new Date();
    const commandClass = new cmd(client, { type: "classic", cmdName, message, args: parsed._, content: text.replace(command, "").trim(), specialArgs: (({ _, ...o }) => o)(parsed) }); // we also provide the message content as a parameter for cases where we need more accuracy
    const result = await commandClass.run();
    const endTime = new Date();
    if ((endTime.getTime() - startTime.getTime()) >= 180000) reference.allowedMentions.repliedUser = true;
    if (typeof result === "string") {
      reference.allowedMentions.repliedUser = true;
      await client.rest.channels.createMessage(message.channelID, Object.assign({
        content: result
      }, reference));
    } else if (typeof result === "object") {
      if (result.contents && result.name) {
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
        if (result.contents.length > fileSize) {
          if (process.env.TEMPDIR && process.env.TEMPDIR !== "" && commandClass.permissions.has("EMBED_LINKS")) {
            await upload(client, result, message);
          } else {
            await client.rest.channels.createMessage(message.channelID, {
              content: getString("image.noTempServer")
            });
          }
        } else {
          await client.rest.channels.createMessage(message.channelID, Object.assign({
            files: [result]
          }, reference));
        }
      } else {
        await client.rest.channels.createMessage(message.channelID, Object.assign(result, reference));
      }
    }
  } catch (error) {
    if (process.env.SENTRY_DSN && process.env.SENTRY_DSN !== "") Sentry.captureException(error, {
      tags: {
        process: process.env.pm_id ? Number.parseInt(process.env.pm_id) - 1 : 0,
        command,
        args: JSON.stringify(preArgs)
      }
    });
    if (error.toString().includes("Request entity too large")) {
      await client.rest.channels.createMessage(message.channelID, Object.assign({
        content: getString("image.tooLarge")
      }, reference));
    } else if (error.toString().includes("Job ended prematurely")) {
      await client.rest.channels.createMessage(message.channelID, Object.assign({
        content: getString("image.jobEnded")
      }, reference));
    } else if (error.toString().includes("Timed out")) {
      await client.rest.channels.createMessage(message.channelID, Object.assign({
        content: getString("image.timeoutDownload")
      }, reference));
    } else {
      _error(`Error occurred with command message ${message.content}: ${error.stack || error}`);
      try {
        let err = error;
        if (error?.constructor?.name === "Promise") err = await error;
        await client.rest.channels.createMessage(message.channelID, Object.assign({
          content: `${getString("error")} <https://github.com/esmBot/esmBot/issues>`,
          files: [{
            contents: Buffer.from(`Message: ${clean(err)}\n\nStack Trace: ${clean(err.stack)}`),
            name: "error.txt"
          }]
        }, reference));
      } catch (e) {
        _error(`While attempting to send the previous error message, another error occurred: ${e.stack || e}`);
      }
    }
  } finally {
    if (database) {
      await database.addCount(aliases.get(command) ?? command);
    }
  }
};
