const db = require("../utils/database.js");

exports.run = async (message, args) => {
  if (!message.member.permission.has("administrator") && message.member.id !== process.env.OWNER) return `${message.author.mention}, you need to be an administrator to enable/disable me!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide whether I should be enabled or disabled in this channel!`;
  if (args[0] !== "disable" && args[0] !== "enable") return `${message.author.mention}, that's not a valid option!`;
  const guildDB = await db.query("SELECT * FROM guilds WHERE guild_id = $1", [message.channel.guild.id]);
  if (args[0].toLowerCase() === "disable") {
    if (args[1] && args[1].match(/^<?[@#]?[&!]?\d+>?$/) && args[1] >= 21154535154122752) {
      const id = args[1].replace("@", "").replace("#", "").replace("!", "").replace("&", "").replace("<", "").replace(">", "");
      if (guildDB.rows[0].disabled.includes(id)) return `${message.author.mention}, I'm already disabled in this channel!`;
      guildDB.rows[0].disabled.push(id);
    } else {
      if (guildDB.rows[0].disabled.includes(message.channel.id)) return `${message.author.mention}, I'm already disabled in this channel!`;
      guildDB.rows[0].disabled.push(message.channel.id);
    }
    await db.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [guildDB.rows[0].disabled, message.channel.guild.id]);
    return `${message.author.mention}, I have been disabled in this channel. To re-enable me, just run \`${guildDB.rows[0].prefix}channel enable\`.`;
  } else if (args[0].toLowerCase() === "enable") {
    if (args[1] && args[1].match(/^<?[@#]?[&!]?\d+>?$/) && args[1] >= 21154535154122752) {
      const id = args[1].replace("@", "").replace("#", "").replace("!", "").replace("&", "").replace("<", "").replace(">", "");
      if (!guildDB.rows[0].disabled.includes(id)) return `${message.author.mention}, I'm not disabled in that channel!`;
      guildDB.rows[0].disabled = guildDB.rows[0].disabled.filter(item => item !== id);
    } else {
      if (!guildDB.rows[0].disabled.includes(message.channel.id)) return `${message.author.mention}, I'm not disabled in this channel!`;
      guildDB.rows[0].disabled = guildDB.rows[0].disabled.filter(item => item !== message.channel.id );
    }
    await db.query("UPDATE guilds SET disabled = $1 WHERE guild_id = $2", [guildDB.rows[0].disabled, message.channel.guild.id]);
    return `${message.author.mention}, I have been re-enabled in this channel.`;
  }
};

exports.category = 1;
exports.help = "Enables/disables me in a channel";
exports.params = "[enable/disable] {id}";