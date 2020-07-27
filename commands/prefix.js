const database = require("../utils/database.js");

exports.run = async (message, args) => {
  const guild = await database.guilds.findOne({ id: message.channel.guild.id });
  if (args.length !== 0) {
    if (!message.member.permission.has("administrator") && message.member.id !== process.env.OWNER) return `${message.author.mention}, you need to be an administrator to change the bot prefix!`;
    guild.set("prefix", args[0]);
    await guild.save();
    return `The prefix has been changed to ${args[0]}.`;
  } else {
    return `${message.author.mention}, the current prefix is \`${guild.prefix}\`.`;
  }
};

exports.aliases = ["setprefix", "changeprefix", "checkprefix"];
exports.category = 1;
exports.help = "Checks/changes the server prefix";
exports.params = "{prefix}";