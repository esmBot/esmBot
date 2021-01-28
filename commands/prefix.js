const database = require("../utils/database.js");

exports.run = async (message, args) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  const guild = await database.getGuild(message.channel.guild.id);
  if (args.length !== 0) {
    if (!message.member.permissions.has("administrator") && message.member.id !== process.env.OWNER) return `${message.author.mention}, you need to be an administrator to change the bot prefix!`;
    await database.setPrefix(args[0], message.channel.guild);
    return `The prefix has been changed to ${args[0]}.`;
  } else {
    return `${message.author.mention}, the current prefix is \`${guild.prefix}\`.`;
  }
};

exports.aliases = ["setprefix", "changeprefix", "checkprefix"];
exports.category = 1;
exports.help = "Checks/changes the server prefix";
exports.params = "{prefix}";