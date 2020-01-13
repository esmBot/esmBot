const client = require("../utils/client.js");

exports.run = async (message) => {
  if (!message.member.permission.has("banMembers")) return `${message.author.mention}, you need to have the \`Ban Members\` permission on this server to ban people!`;
  if (!message.channel.guild.members.get(client.user.id).permission.has("banMembers") && !message.channel.permissionsOf(client.user.id).has("banMembers")) return `${message.author.mention}, I don't have the \`Ban Members\` permission!`;
  const member = message.mentions[0];
  if (member) {
    try {
      await message.channel.guild.banMember(member.id, 0, `ban command used by @${message.author.username}#${message.author.discriminator}`);
      return `Successfully banned ${member.mention}.`;
    } catch (e) {
      return `${message.author.mention}, I was unable to ban the member. Have you given me permissions?`;
    }
  } else {
    return `${message.author.mention}, you need to provide a member to ban!`;
  }
};

exports.category = 2;
exports.help = "Bans a server member";
exports.params = "[mention]";