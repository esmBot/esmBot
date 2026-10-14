import process from "node:process";
import { type AnyTextableChannel, GroupChannel, type Message, PrivateChannel, ThreadChannel } from "oceanic.js";
import Command from "#cmd-classes/command.js";
import { aliases, commands } from "#utils/collections.js";
import { getString } from "#utils/i18n.js";
import logger from "#utils/logger.js";
import parseCommand from "#utils/parseCommand.js";
import { respond, respondError } from "#utils/respond.js";
import type { DBGuild, EventParams } from "#utils/types.js";

let mentionRegex: RegExp;

/**
 * Runs when someone sends a message.
 */
export default async ({ client, database }: EventParams, message: Message) => {
  // block if client is not ready yet
  if (!client.ready) return;

  // ignore other bots
  if (message.author.bot) return;

  // ignore when message content is missing
  if (message.content === "") return;

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
    guildDB = await database.getGuild(message.guildID);
    if (message.content.startsWith(guildDB.prefix)) {
      text = message.content.substring(guildDB.prefix.length).trim();
    } else {
      return;
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
  const cmdBase = commands.get(cmdName);
  if (!cmdBase) return;

  let cmd = cmdBase as typeof Command;
  if (!(cmd.prototype instanceof Command)) return;

  // parse args
  const parsed = parseCommand(preArgs);
  let canon = cmdName;
  if (cmdBase.baseCommand) {
    const lowerSub = parsed.args.map((v) => v.toLowerCase());
    for (const sub of lowerSub) {
      const newCanon = `${canon} ${sub}`;
      const subAlias = aliases.get(newCanon);
      const subCmd = commands.get(subAlias ?? newCanon);
      if (!subCmd) break;
      cmd = subCmd as typeof Command;
      canon = newCanon;
      parsed.args = parsed.args.slice(1);
    }
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
    if (!guildDB) guildDB = await database.getGuild(message.guildID);
    if (guildDB.disabled.includes(message.channelID) && command !== "channel") return;

    const disabledCmds = guildDB.disabled_commands;
    if (disabledCmds.includes(command) || disabledCmds.includes(cmdName) || disabledCmds.includes(canon)) return;
  }

  // actually run the command
  if (!process.env.DISABLE_CMD_LOG || process.env.DISABLE_CMD_LOG !== "true") {
    logger.log("log", `${message.author.username} (${message.author.id}) ran classic command ${command}`);
  }

  try {
    const commandClass = new cmd(client, database, {
      type: "classic",
      cmdName: canon,
      message,
      args: parsed.args,
      content: text.replace(command, "").trim(), // we also provide the message content as a parameter for cases where we need more accuracy
      specialArgs: parsed.flags,
    });
    const result = await commandClass.run();
    await respond({ result, cmdName, commandClass, context: message });
  } catch (e) {
    await respondError({ error: e as Error, cmdName, context: message, args: preArgs });
  } finally {
    if (database) {
      await database.addCount(cmdName);
    }
  }
};
