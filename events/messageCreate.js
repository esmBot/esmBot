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
  const guildConf = (await database.guilds.find({ id: message.channel.guild.id }).exec())[0];
  const prefix = prefixMention.test(message.content) ? message.content.match(prefixMention)[0] : guildConf.prefix;

  // xp stuff
  const xp = (await database.xp.find({ id: message.channel.guild.id }).exec())[0];
  if (xp.enabled === true) {
    //console.log(xp.members);
    const info = xp.members.get(message.author.id);
    if (!info) {
      logger.log("Member not in XP database, adding");
      const memberInfo = {
        xpAmount: 1,
        level: 0
      };
      xp.members.set(message.author.id, memberInfo);
      await xp.save();
    } else {
      let newLevel;
      const newAmount = info.xpAmount + 1;
      //xp.members[message.author.id].xpAmount++;
      const level = Math.floor(0.1 * Math.sqrt(newAmount));
      if (info.level < level) {
        newLevel = info.level++;
        //xp.members[message.author.id].level++;
        logger.log(`${message.author.username} has leveled up`);
        if (message.channel.guild.id === "631290275456745502" && level === 5) {
          await message.author.addRole("638759280752853022", "level 5");
          await message.channel.createMessage(`${message.author.mention} just leveled up to level ${level}... AND unlocked the better members role!`);
        } else if (message.channel.guild.id === "631290275456745502" && level === 10) {
          await message.author.addRole("638822807626711078", "level 10");
          await message.channel.createMessage(`${message.author.mention} just leveled up to level ${level}... AND unlocked the even better members role!`);
        } else if (message.channel.guild.id === "631290275456745502" && level === 25) {
          await message.author.addRole("631299545657114645", "level 25");
          await message.channel.createMessage(`${message.author.mention} just leveled up to level ${level}... AND unlocked the best members role!`);
        } else {
          await message.channel.createMessage(`${message.author.mention} just leveled up to level ${level}!`);
        }
      }
      xp.members.set(message.author.id, {
        xpAmount: newAmount,
        level: newLevel ? newLevel : info.level
      });
      await xp.save();
    }
  }

  // ignore other stuff
  if (message.content.startsWith(prefix) === false && message.mentions.indexOf(client.user) <= -1 && message.channel.id !== "573553254575898626" && (!message.content.match(/https?:\/\/(media|cdn)\.discordapp\.(net|com)\/attachments\/596766080014221373\/606176845871972383\/1561668913236-3.gif/))) return;

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
