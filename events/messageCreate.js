import database from "../utils/database.js";
import { log, error as _error } from "../utils/logger.js";
import { prefixCache, aliases, disabledCache, disabledCmdCache, commands } from "../utils/collections.js";
import parseCommand from "../utils/parseCommand.js";
import { clean } from "../utils/misc.js";
import { upload } from "../utils/tempimages.js";
import { ThreadChannel } from "oceanic.js";

let mentionRegex;

// run when someone sends a message
export default async (client, message) => {
  // block if client is not ready yet
  if (!client.ready) return;

  // ignore other bots
  if (message.author.bot) return;

  // don't run command if bot can't send messages
  let permChannel = message.channel;
  if (permChannel instanceof ThreadChannel && !permChannel.parent) {
    try {
      permChannel = await client.rest.channels.get(message.channel.parentID);
    } catch {
      return;
    }
  }
  if (message.guildID && !permChannel.permissionsOf(client.user.id.toString()).has("SEND_MESSAGES")) return;

  if (!mentionRegex) mentionRegex = new RegExp(`^<@!?${client.user.id}> `);

  let guildDB;
  let text;
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
  } else if (message.content.startsWith(process.env.PREFIX)) {
    text = message.content.substring(process.env.PREFIX.length).trim();
  } else if (!message.guildID) {
    text = message.content;
  } else {
    return;
  }

  // separate commands and args
  const preArgs = text.split(/\s+/g);
  const command = preArgs.shift().toLowerCase();
  const aliased = aliases.get(command);

  // check if command exists and if it's enabled
  const cmd = commands.get(aliased ?? command);
  if (!cmd) return;

  // block certain commands from running in DMs
  if (!cmd.directAllowed && !message.guildID) return;

  if (cmd.dbRequired && !database) {
    await client.rest.channels.createMessage(message.channelID, {
      content: "This command is unavailable on stateless instances of esmBot."
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
    if (disabled.includes(message.channelID) && command != "channel") return;

    let disabledCmds = disabledCmdCache.get(message.guildID);
    if (!disabledCmds) {
      if (!guildDB) guildDB = await database.getGuild(message.guildID);
      disabledCmdCache.set(message.guildID, guildDB.disabled_commands ?? guildDB.disabledCommands);
      disabledCmds = guildDB.disabled_commands ?? guildDB.disabledCommands;
    }
    if (disabledCmds.includes(aliased ?? command)) return;
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
    if (database) {
      await database.addCount(aliases.get(command) ?? command);
    }
    const startTime = new Date();
    // eslint-disable-next-line no-unused-vars
    const commandClass = new cmd(client, { type: "classic", message, args: parsed._, content: text.replace(command, "").trim(), specialArgs: (({ _, ...o }) => o)(parsed) }); // we also provide the message content as a parameter for cases where we need more accuracy
    const result = await commandClass.run();
    const endTime = new Date();
    if ((endTime - startTime) >= 180000) reference.allowedMentions.repliedUser = true;
    if (typeof result === "string") {
      reference.allowedMentions.repliedUser = true;
      await client.rest.channels.createMessage(message.channelID, Object.assign({
        content: result
      }, reference));
    } else if (typeof result === "object") {
      if (result.contents && result.name) {
        let fileSize = 8388119;
        if (message.guildID) {
          switch (message.guild.premiumTier) {
            case 2:
              fileSize = 52428308;
              break;
            case 3:
              fileSize = 104856616;
              break;
          }
        }
        if (result.contents.length > fileSize) {
          if (process.env.TEMPDIR && process.env.TEMPDIR !== "") {
            await upload(client, result, message);
          } else {
            await client.rest.channels.createMessage(message.channelID, {
              content: "The resulting image was more than 8MB in size, so I can't upload it."
            });
          }
        } else {
          await client.rest.channels.createMessage(message.channelID, Object.assign({
            content: result.text ? result.text : undefined,
            files: [result]
          }, reference));
        }
      } else {
        await client.rest.channels.createMessage(message.channelID, Object.assign(result, reference));
      }
    }
  } catch (error) {
    if (error.toString().includes("Request entity too large")) {
      await client.rest.channels.createMessage(message.channelID, Object.assign({
        content: "The resulting file was too large to upload. Try again with a smaller image if possible."
      }, reference));
    } else if (error.toString().includes("Job ended prematurely")) {
      await client.rest.channels.createMessage(message.channelID, Object.assign({
        content: "Something happened to the image servers before I could receive the image. Try running your command again."
      }, reference));
    } else if (error.toString().includes("Timed out")) {
      await client.rest.channels.createMessage(message.channelID, Object.assign({
        content: "The request timed out before I could download that image. Try uploading your image somewhere else or reducing its size."
      }, reference));
    } else {
      _error(`Error occurred with command message ${message.content}: ${error.stack || error}`);
      try {
        let err = error;
        if (error?.constructor?.name == "Promise") err = await error;
        await client.rest.channels.createMessage(message.channelID, Object.assign({
          content: "Uh oh! I ran into an error while running this command. Please report the content of the attached file at the following link or on the esmBot Support server: <https://github.com/esmBot/esmBot/issues>",
          files: [{
            contents: `Message: ${clean(err)}\n\nStack Trace: ${clean(err.stack)}`,
            name: "error.txt"
          }]
        }, reference));
      } catch (e) {
        _error(`While attempting to send the previous error message, another error occurred: ${e.stack || e}`);
      }
    }
  }
};
