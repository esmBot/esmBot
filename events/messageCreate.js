const fs = require("fs");
const database = require("../utils/database.js");
const logger = require("../utils/logger.js");
const collections = require("../utils/collections.js");
//const commands = [...collections.aliases.keys(), ...collections.commands.keys()];

// run when someone sends a message
module.exports = async (client, cluster, ipc, message) => {
  // ignore dms and other bots
  if (message.author.bot) return;

  // don't run command if bot can't send messages
  if (message.channel.guild && !message.channel.permissionsOf(client.user.id).has("sendMessages")) return;

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

  let prefix;
  let isMention = false;
  if (message.channel.guild) {
    const user = message.channel.guild.members.get(client.user.id);
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
    prefix = "";
  }

  // ignore other stuff
  if (message.content.startsWith(prefix) === false) return;

  // separate commands and args
  const replace = isMention ? `@${client.user.username} ` : prefix;
  const content = message.cleanContent.substring(replace.length).trim();
  const rawContent = message.content.substring(prefix.length).trim();
  const args = content.split(/\s+/g);
  args.shift();
  const command = rawContent.split(/\s+/g).shift().toLowerCase();

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
  logger.log("log", `${message.author.username} (${message.author.id}) ran command ${command}`);
  const reference = {
    messageReference: {
      channelID: message.channel.id,
      messageID: message.id,
      guildID: message.channel.guild ? message.channel.guild.id : undefined,
      failIfNotExists: false
    },
    allowedMentions: {
      repliedUser: false
    }
  };
  try {
    await database.addCount(collections.aliases.has(command) ? collections.aliases.get(command) : command);
    const startTime = new Date();
    const commandClass = new cmd(client, cluster, ipc, message, args, message.content.substring(prefix.length).trim().replace(command, "").trim()); // we also provide the message content as a parameter for cases where we need more accuracy
    const result = await commandClass.run();
    const endTime = new Date();
    if ((endTime - startTime) >= 180000) reference.allowedMentions.repliedUser = true;
    if (typeof result === "string") {
      reference.allowedMentions.repliedUser = true;
      await client.createMessage(message.channel.id, Object.assign({
        content: result
      }, reference));
    } else if (typeof result === "object" && result.embed) {
      await client.createMessage(message.channel.id, Object.assign(result, reference));
    } else if (typeof result === "object" && result.file) {
      if (result.file.length > 8388119 && process.env.TEMPDIR !== "") {
        const filename = `${Math.random().toString(36).substring(2, 15)}.${result.name.split(".")[1]}`;
        await fs.promises.writeFile(`${process.env.TEMPDIR}/${filename}`, result.file);
        await client.createMessage(message.channel.id, Object.assign({
          embed: {
            color: 16711680,
            title: "Here's your image!",
            url: `${process.env.TMP_DOMAIN == "" ? "https://tmp.projectlounge.pw" : process.env.TMP_DOMAIN}/${filename}`,
            image: {
              url: `${process.env.TMP_DOMAIN == "" ? "https://tmp.projectlounge.pw" : process.env.TMP_DOMAIN}/${filename}`
            },
            footer: {
              text: "The result image was more than 8MB in size, so it was uploaded to an external site instead."
            },
          }
        }, reference));
      } else {
        await client.createMessage(message.channel.id, Object.assign({
          content: result.text ? result.text : undefined
        }, reference), result);
      }
    }
  } catch (error) {
    if (error.toString().includes("Request entity too large")) {
      await client.createMessage(message.channel.id, Object.assign({
        content: "The resulting file was too large to upload. Try again with a smaller image if possible."
      }, reference));
    } else if (error.toString().includes("Job ended prematurely")) {
      await client.createMessage(message.channel.id, Object.assign({
        content: "Something happened to the image servers before I could receive the image. Try running your command again."
      }, reference));
    } else if (error.toString().includes("Timed out")) {
      await client.createMessage(message.channel.id, Object.assign({
        content: "The request timed out before I could download that image. Try uploading your image somewhere else or reducing its size."
      }, reference));
    } else {
      logger.error(`Error occurred with command message ${message.cleanContent}: ${error.toString()}`);
      try {
        await client.createMessage(message.channel.id, Object.assign({
          content: "Uh oh! I ran into an error while running this command. Please report the content of the attached file at the following link or on the esmBot Support server: <https://github.com/esmBot/esmBot/issues>"
        }, reference), [{
          file: `Message: ${error}\n\nStack Trace: ${error.stack}`,
          name: "error.txt"
        }]);
      } catch { /* silently ignore */ }
    }
  }
};
