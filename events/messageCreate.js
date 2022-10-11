import database from "../utils/database.js";
import { log, error as _error } from "../utils/logger.js";
import { prefixCache, aliases, disabledCache, disabledCmdCache, commands } from "../utils/collections.js";
import parseCommand from "../utils/parseCommand.js";
import { clean, cleanMessage } from "../utils/misc.js";
import { upload } from "../utils/tempimages.js";
import { ThreadChannel } from "oceanic.js";

// run when someone sends a message
export default async (client, message) => {
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

  let prefixCandidate;
  let guildDB;
  if (message.guildID) {
    const cachedPrefix = prefixCache.get(message.guildID);
    if (cachedPrefix) {
      prefixCandidate = cachedPrefix;
    } else {
      guildDB = await database.getGuild(message.guildID);
      if (!guildDB) {
        guildDB = await database.fixGuild(message.guildID);
      }
      prefixCandidate = guildDB.prefix;
      prefixCache.set(message.guildID, guildDB.prefix);
    }
  }

  let prefix;
  let isMention = false;
  if (message.guildID) {
    const user = message.guild.members.get(client.user.id);
    if (message.content.startsWith(user.mention)) {
      prefix = `${user.mention} `;
      isMention = true;
    } else if (message.content.startsWith(`<@${client.user.id}>`)) { // workaround for member.mention not accounting for both mention types
      prefix = `<@${client.user.id}> `;
      isMention = true;
    } else {
      prefix = prefixCandidate;
    }
  } else {
    prefix = process.env.PREFIX;
  }

  // ignore other stuff
  if (!message.content.startsWith(prefix)) return;

  // separate commands and args
  const replace = isMention ? `@${(message.guild ? message.guild.members.get(client.user.id).nick : client.user.username) ?? client.user.username} ` : prefix;
  const content = cleanMessage(message).substring(replace.length).trim();
  const rawContent = message.content.substring(prefix.length).trim();
  const preArgs = content.split(/\s+/g);
  preArgs.shift();
  const command = rawContent.split(/\s+/g).shift().toLowerCase();
  const parsed = parseCommand(preArgs);
  const aliased = aliases.get(command);

  // don't run if message is in a disabled channel
  if (message.guildID) {
    const disabled = disabledCache.get(message.guildID);
    if (disabled) {
      if (disabled.includes(message.channelID) && command != "channel") return;
    } else {
      guildDB = await database.getGuild(message.guildID);
      disabledCache.set(message.guildID, guildDB.disabled);
      if (guildDB.disabled.includes(message.channelID) && command !== "channel") return;
    }

    const disabledCmds = disabledCmdCache.get(message.guildID);
    if (disabledCmds) {
      if (disabledCmds.includes(aliased ?? command)) return;
    } else {
      guildDB = await database.getGuild(message.guildID);
      disabledCmdCache.set(message.guildID, guildDB.disabled_commands ?? guildDB.disabledCommands);
      if ((guildDB.disabled_commands ?? guildDB.disabledCommands).includes(aliased ?? command)) return;
    }
  }

  // check if command exists and if it's enabled
  const cmd = commands.get(aliased ?? command);
  if (!cmd) return;

  // block certain commands from running in DMs
  if (!cmd.directAllowed && !message.guildID) return;

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
    await database.addCount(aliases.get(command) ?? command);
    const startTime = new Date();
    // eslint-disable-next-line no-unused-vars
    const commandClass = new cmd(client, { type: "classic", message, args: parsed._, content: message.content.substring(prefix.length).trim().replace(command, "").trim(), specialArgs: (({ _, ...o }) => o)(parsed) }); // we also provide the message content as a parameter for cases where we need more accuracy
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
