const database = require("../utils/database.js");

exports.run = async (message, args) => {
  if (args.length !== 0) {
    if (!message.member.permission.has("administrator") && message.member.id !== "198198681982205953") return `${message.author.mention}, you need to be an administrator to change the bot prefix!`;
    database.settings.set(message.channel.guild.id, args[0], "prefix");
    return `The prefix has been changed to ${args[0]}.`;
  } else {
    return `${message.author.mention}, the current prefix is \`${database.settings.get(message.channel.guild.id, "prefix")}\`.`;
  }
};

exports.aliases = ["setprefix", "changeprefix", "checkprefix"];
