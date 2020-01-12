const client = require("../utils/client.js");
const database = require("../utils/database.js");
const misc = require("../utils/misc.js");
const logger = require("../utils/logger.js");
const collections = require("../utils/collections.js");

// run when someone sends a message
module.exports = async (message) => {
  // ignore dms and other bots
  if (message.author.bot) return;
  if (!message.channel.guild) return;

  // don't run command if bot can't send messages
  if (!message.channel.guild.members.get(client.user.id).permission.has("sendMessages") || !message.channel.permissionsOf(client.user.id).has("sendMessages")) return;

  // prefix can be a mention or a set of special characters
  const prefixMention = new RegExp(`^<@!?${client.user.id}> `);
  const guildConf = (await database.guilds.find({ id: message.channel.guild.id }).exec())[0];
  const prefix = prefixMention.test(message.content) ? message.content.match(prefixMention)[0] : guildConf.prefix;

  // ignore other stuff
  if (message.content.startsWith(prefix) === false && !message.mentions.includes(client.user) && message.channel.id !== "573553254575898626") return;

  // funny stuff
  if (message.channel.id === "573553254575898626" && message.channel.guild.id === "433408970955423765") {
    const generalChannel = client.guilds.get("631290275456745502").channels.get("631290275888627713");
    if (message.attachments.length !== 0) {
      const attachments = [];
      for (const attachment of message.attachments) {
        const res = await require("node-fetch")(attachment.url);
        attachments.push({ file: await res.buffer(), name: attachment.filename });
      }
      await client.createMessage(generalChannel.id, message.content, attachments);
    } else {
      await client.createMessage(generalChannel.id, message.content);
    }
  }

  // separate commands and args
  const escapedPrefix = misc.regexEscape(prefix);
  const prefixRegex = new RegExp(`^(${escapedPrefix})`);
  const args = message.content.replace(prefixRegex, "").trim().split(/ +/g);
  const command = args.shift().toLowerCase();

  // check if command exists
  const cmd = collections.commands.get(command) || collections.commands.get(collections.aliases.get(command));
  if (!cmd) return;

  // actually run the command
  logger.log("info", `${message.author.username} (${message.author.id}) ran command ${command}`);
  try {
    const result = await cmd(message, args);
    if (typeof result === "string") {
      await client.createMessage(message.channel.id, result);
    }
  } catch (error) {
    logger.error(error.toString());
    await client.createMessage(message.channel.id, "Uh oh! I ran into an error while running this command. Please report the content of the attached file here or on the esmBot Support server: <https://github.com/TheEssem/esmBot/issues>", [{
      file: Buffer.from(`Message: ${error}\n\nStack Trace: ${error.stack}`),
      name: "error.txt"
    }]);
  }
};
