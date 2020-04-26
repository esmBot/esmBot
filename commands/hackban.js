const client = require("../utils/client.js");

exports.run = async (message, args) => {
  if (!message.member.permission.has("banMembers")) return `${message.author.mention}, you need to have the \`Ban Members\` permission on this server to ban people!`;
  if (!message.channel.guild.members.get(client.user.id).permission.has("banMembers") && !message.channel.permissionsOf(client.user.id).has("banMembers")) return `${message.author.mention}, I don't have the \`Ban Members\` permission!`;
  if (!args[0].match(/^<?[@#]?[&!]?\d+>?$/) && args[0] < 21154535154122752) return `${message.author.mention}, that's not a valid snowflake!`;
  try {
    const id = args[0].replace("@", "").replace("#", "").replace("!", "").replace("&", "").replace("<", "").replace(">", "");
    await message.channel.guild.banMember(id, 0, `Hackban command used by @${message.author.username}#${message.author.discriminator}`);
    return `Successfully banned user with ID \`${id}\`.`;
  } catch (e) {
    throw e;
    //return `${message.author.mention}, I was unable to ban the member. Have you given me permissions?`;
  }
};

exports.aliases = ["prevent", "preban"];
exports.category = 2;
exports.help = "Bans a member via user id";
exports.params = "[id]";