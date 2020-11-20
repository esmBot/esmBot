const db = require("../utils/database.js");

exports.run = async (message, args) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.permission.has("administrator") && message.member.id !== process.env.OWNER) return `${message.author.mention}, you need to be an administrator to enable/disable me!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide whether I should be enabled or disabled in this channel!`;
  if (args[0] !== "disable" && args[0] !== "enable") return `${message.author.mention}, that's not a valid option!`;
  const guildDB = await db.guilds.findOne({id: message.channel.guild.id});
  if (args[0].toLowerCase() === "disable") {
    if (args[1] && args[1].match(/^<?[@#]?[&!]?\d+>?$/) && args[1] >= 21154535154122752) {
      const id = args[1].replace(/@/g, "").replace(/#/g, "").replace(/!/g, "").replace(/&/g, "").replace(/</g, "").replace(/>/g, "");
      if (guildDB.disabledChannels.includes(id)) return `${message.author.mention}, I'm already disabled in this channel!`;
      guildDB.disabledChannels.push(id);
    } else {
      if (guildDB.disabledChannels.includes(message.channel.id)) return `${message.author.mention}, I'm already disabled in this channel!`;
      guildDB.disabledChannels.push(message.channel.id);
    }
    await guildDB.save();
    return `${message.author.mention}, I have been disabled in this channel. To re-enable me, just run \`${guildDB.prefix}channel enable\`.`;
  } else if (args[0].toLowerCase() === "enable") {
    if (args[1] && args[1].match(/^<?[@#]?[&!]?\d+>?$/) && args[1] >= 21154535154122752) {
      const id = args[1].replace(/@/g, "").replace(/#/g, "").replace(/!/g, "").replace(/&/g, "").replace(/</g, "").replace(/>/g, "");
      if (!guildDB.disabledChannels.includes(id)) return `${message.author.mention}, I'm not disabled in that channel!`;
      guildDB.disabledChannels = guildDB.disabledChannels.filter(item => item !== id);
    } else {
      if (!guildDB.disabledChannels.includes(message.channel.id)) return `${message.author.mention}, I'm not disabled in this channel!`;
      guildDB.disabledChannels = guildDB.disabledChannels.filter(item => item !== message.channel.id );
    }
    await guildDB.save();
    return `${message.author.mention}, I have been re-enabled in this channel.`;
  }
};

exports.category = 1;
exports.help = "Enables/disables me in a channel";
exports.params = "[enable/disable] {id}";