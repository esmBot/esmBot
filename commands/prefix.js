const database = require("../utils/database.js");

exports.run = async (message, args) => {
  const guild = (await database.guilds.find({ id: message.channel.guild.id }).exec())[0];
  if (args.length !== 0) {
    if (!message.member.permission.has("administrator") && message.member.id !== "198198681982205953") return `${message.author.mention}, you need to be an administrator to change the bot prefix!`;
    guild.set("prefix", args[0]);
    await guild.save();
    return `The prefix has been changed to ${args[0]}.`;
  } else {
    return `${message.author.mention}, the current prefix is \`${guild.prefix}\`.`;
  }
};

exports.aliases = ["setprefix", "changeprefix", "checkprefix"];
