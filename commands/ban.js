const client = require("../utils/client.js");

exports.run = async (message, args) => {
  if (!message.member.permission.has("banMembers")) return `${message.author.mention}, you need to have the \`Ban Members\` permission on this server to ban people!`;
  if (!message.channel.guild.members.get(client.user.id).permission.has("banMembers") && !message.channel.permissionsOf(client.user.id).has("banMembers")) return `${message.author.mention}, I don't have the \`Ban Members\` permission!`;
  const member = message.mentions[0];
  if (member) {
    try {
      await message.channel.guild.banMember(member.id, 0, `Ban command used by @${message.author.username}#${message.author.discriminator}`);
      return `Successfully banned ${member.mention}.`;
    } catch (e) {
      return `${message.author.mention}, I was unable to ban the member. They might not exist or I don't have the permissions to do so.`;
    }
  } else if (args[0].match(/^<?[@#]?[&!]?\d+>?$/) && args[0] >= 21154535154122752) {
    try {
      const id = args[0].replace("@", "").replace("#", "").replace("!", "").replace("&", "").replace("<", "").replace(">", "");
      await message.channel.guild.banMember(id, 0, `Banned by ID, command used by @${message.author.username}#${message.author.discriminator}`);
      return `Successfully banned user with ID \`${id}\`.`;
    } catch (e) {
      return `${message.author.mention}, I was unable to ban the member. They might not exist or I don't have the permissions to do so.`;
    }
  } else {
    return `${message.author.mention}, you need to provide a member to ban!`;
  }
};

exports.aliases = ["hackban", "prevent", "preban"];
exports.category = 2;
exports.help = "Bans a server member";
exports.params = "[mention/id]";