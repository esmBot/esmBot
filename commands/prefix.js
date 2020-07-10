const database = require("../utils/database.js");

exports.run = async (message, args) => {
  const guildDB = await database.query("SELECT * FROM guilds WHERE guild_id = $1", [message.channel.guild.id]);
  if (args.length !== 0) {
    if (!message.member.permission.has("administrator") && message.member.id !== process.env.OWNER) return `${message.author.mention}, you need to be an administrator to change the bot prefix!`;
    if (args[0].length > 15) return `${message.author.mention}, that prefix is too long!`;
    await database.query("UPDATE guilds SET prefix = $1 WHERE guild_id = $2", [args[0], message.channel.guild.id]);
    return `The prefix has been changed to ${args[0]}.`;
  } else {
    return `${message.author.mention}, the current prefix is \`${guildDB.rows[0].prefix}\`.`;
  }
};

exports.aliases = ["setprefix", "changeprefix", "checkprefix"];
exports.category = 1;
exports.help = "Checks/changes the server prefix";
exports.params = "{prefix}";