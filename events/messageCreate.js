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

  // prefix can be a mention or a set of special characters
  const prefixMention = new RegExp(`^<@!?${client.user.id}> `);
  const guildConf = database.settings.ensure(message.channel.guild.id, misc.defaults);
  const prefix = prefixMention.test(message.content) ? message.content.match(prefixMention)[0] : guildConf.prefix;

  // ignore other stuff
  // && !message.attachments && message.attachments[0].filename !== "1561668913236-3.gif"
  if (message.content.startsWith(prefix) === false && message.mentions.indexOf(client.user) <= -1 && message.channel.id !== "573553254575898626" && (!message.content.match(/https?:\/\/(media|cdn)\.discordapp\.(net|com)\/attachments\/596766080014221373\/606176845871972383\/1561668913236-3.gif/))) return;

  // funny stuff
  if (message.channel.id === "573553254575898626" && message.channel.guild.id === "433408970955423765") {
    const generalChannel = client.guilds.get("322114245632327703").channels.get("322114245632327703");
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
  const odyMessages = ["Nope!", "No jojo gif here", "sorry ody, this gif is illegal", "get owned"];
  // || (message.attachments && message.attachments[0].filename === "1561668913236-3.gif")
  if (message.channel.guild.id === "322114245632327703" && (message.content.match(/https?:\/\/(media|cdn)\.discordapp\.(net|com)\/attachments\/596766080014221373\/606176845871972383\/1561668913236-3.gif/))) {
    await message.delete("anti-jojo mechanism");
    await client.createMessage(message.channel.id, misc.random(odyMessages));
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
    logger.error(error.stack);
    await client.createMessage(message.channel.id, "Uh oh! I ran into an error while running this command. Please report the content of the attached file here: <https://github.com/TheEssem/esmBot-rewrite/issues>", [{
      file: Buffer.from(`Message: ${error}\n\nStack Trace: ${error.stack}`),
      name: "error.txt"
    }]);
  }
};
