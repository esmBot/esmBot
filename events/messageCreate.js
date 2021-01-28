const fs = require("fs");
const client = require("../utils/client.js");
const database = require("../utils/database.js");
const logger = require("../utils/logger.js");
const collections = require("../utils/collections.js");
const commands = [...collections.aliases.keys(), ...collections.commands.keys()];

// run when someone sends a message
module.exports = async (message) => {
  // ignore dms and other bots
  if (message.author.bot) return;

  // don't run command if bot can't send messages
  if (message.channel.guild && (!message.channel.guild.members.get(client.user.id).permissions.has("sendMessages") || !message.channel.permissionsOf(client.user.id).has("sendMessages"))) return;

  // this is here to prevent reading the database if a message is unrelated
  let valid = false;
  for (const key of commands) {
    if (message.content.toLowerCase().includes(key)) {
      valid = true;
      break;
    }
  }
  if (!valid) return;

  let prefixCandidate;
  if (message.channel.guild) {
    if (collections.prefixCache.has(message.channel.guild.id)) {
      prefixCandidate = collections.prefixCache.get(message.channel.guild.id);
    } else {
      let guildDB = message.channel.guild ? await database.getGuild(message.channel.guild.id) : null;
      if (message.channel.guild && !(guildDB && guildDB.disabled)) {
        guildDB = await database.fixGuild(message.channel.guild);
      }
      prefixCandidate = guildDB.prefix;
      collections.prefixCache.set(message.channel.guild.id, guildDB.prefix);
    }
  }

  // this line be like Pain. Pain. Pain. Pain. Pain. Pain. Pain. Pain. Pain. Pain. Pain. Pain.
  // there's also bit of a workaround here due to member.mention not accounting for both mention types
  const prefix = message.channel.guild ? (message.content.startsWith(message.channel.guild.members.get(client.user.id).mention) ? `${message.channel.guild.members.get(client.user.id).mention} ` : (message.content.startsWith(`<@${client.user.id}>`) ? `<@${client.user.id}> ` : prefixCandidate)) : "";

  // ignore other stuff
  if (message.content.startsWith(prefix) === false) return;

  // separate commands and args
  const content = message.content.substring(prefix.length).trim();
  const args = content.split(/ +/g);
  const command = args.shift().toLowerCase();

  // don't run if message is in a disabled channel
  if (message.channel.guild) {
    if (collections.disabledCache.has(message.channel.guild.id)) {
      const disabled = collections.disabledCache.get(message.channel.guild.id);
      if (disabled.includes(message.channel.id) && command != "channel") return;
    } else if (message.channel.guild) {
      const guildDB = await database.getGuild(message.channel.guild.id);
      collections.disabledCache.set(message.channel.guild.id, guildDB.disabled);
      if (guildDB.disabled.includes(message.channel.id) && command !== "channel") return;
    }
  }

  // check if command exists
  const cmd = collections.commands.get(command) || collections.commands.get(collections.aliases.get(command));
  if (!cmd) return;

  // actually run the command
  logger.log("info", `${message.author.username} (${message.author.id}) ran command ${command}`);
  try {
    await database.addCount(collections.aliases.has(command) ? collections.aliases.get(command) : command);
    const result = await cmd(message, args, content.replace(command, "").trim()); // we also provide the message content as a parameter for cases where we need more accuracy
    if (typeof result === "string" || (typeof result === "object" && result.embed)) {
      await client.createMessage(message.channel.id, result);
    } else if (typeof result === "object" && result.file) {
      if (result.file.length > 8388119 && process.env.TEMPDIR !== "") {
        const filename = `${Math.random().toString(36).substring(2, 15)}.${result.name.split(".")[1]}`;
        await fs.promises.writeFile(`${process.env.TEMPDIR}/${filename}`, result.file);
        await client.createMessage(message.channel.id, {
          embed: {
            color: 16711680,
            title: "Here's your image!",
            url: `https://projectlounge.pw/tmp/${filename}`,
            image: {
              url: `https://projectlounge.pw/tmp/${filename}`
            },
            footer: {
              text: "The result image was more than 8MB in size, so it was uploaded to an external site instead."
            },
          }
        });
      } else {
        await client.createMessage(message.channel.id, result.text ? result.text : "", result);
      }
    }
  } catch (error) {
    if (error.toString().includes("Request entity too large")) {
      await client.createMessage(message.channel.id, `${message.author.mention}, the resulting file was too large to upload. Try again with a smaller image if possible.`);
    } else if (error.toString().includes("UDP timed out")) {
      await client.createMessage(message.channel.id, `${message.author.mention}, I couldn't contact the image API in time (most likely due to it being overloaded). Try running your command again.`);
    } else if (error.toString().includes("Timed out")) {
      await client.createMessage(message.channel.id, `${message.author.mention}, the request timed out before I could download that image. Try uploading your image somewhere else.`);
    } else {
      logger.error(error.toString());
      await client.createMessage(message.channel.id, "Uh oh! I ran into an error while running this command. Please report the content of the attached file here or on the esmBot Support server: <https://github.com/esmBot/esmBot/issues>", [{
        file: Buffer.from(`Message: ${error}\n\nStack Trace: ${error.stack}`),
        name: "error.txt"
      }]);
    }
  }
};
