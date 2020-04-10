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
  const guildDB = (await database.guilds.find({ id: message.channel.guild.id }).exec())[0];
  const prefixMention = new RegExp(`^<@!?${client.user.id}> `);
  const prefix = prefixMention.test(message.content) ? message.content.match(prefixMention)[0] : guildDB.prefix;

  // ignore other stuff
  if (message.content.startsWith(prefix) === false) return;

  // separate commands and args
  const prefixRegex = new RegExp(`^(${misc.regexEscape(prefix)})`);
  const content = message.content.replace(prefixRegex, "").trim();
  const args = content.split(/ +/g);
  const command = args.shift().toLowerCase();

  // don't run if message is in a disabled channel
  if (guildDB.disabledChannels.includes(message.channel.id) && command != "channel") return;

  // check if command exists
  const cmd = collections.commands.get(command) || collections.commands.get(collections.aliases.get(command));
  if (!cmd) return;

  // actually run the command
  logger.log("info", `${message.author.username} (${message.author.id}) ran command ${command}`);
  try {
    const result = await cmd(message, args, content.replace(command, "").trim()); // we also provide the message content as a parameter for cases where we need more accuracy
    if (typeof result === "string") {
      await client.createMessage(message.channel.id, result);
    }
  } catch (error) {
    if (!error.toString().includes("Request entity too large")) {
      logger.error(error.toString());
      await client.createMessage(message.channel.id, "Uh oh! I ran into an error while running this command. Please report the content of the attached file here or on the esmBot Support server: <https://github.com/TheEssem/esmBot/issues>", [{
        file: Buffer.from(`Message: ${error}\n\nStack Trace: ${error.stack}`),
        name: "error.txt"
      }]);
    } else {
      await client.createMessage(message.channel.id, `${message.author.mention}, the resulting file was too large to upload. Try again with a smaller image if possible.`);
    }
  }
};
