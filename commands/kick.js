const client = require("../utils/client.js");

exports.run = async (message) => {
  if (!message.channel.guild) return `${message.author.mention}, this command only works in servers!`;
  if (!message.member.permission.has("kickMembers")) return `${message.author.mention}, you need to have the \`Kick Members\` permission on this server to kick people!`;
  if (!message.channel.guild.members.get(client.user.id).permission.has("kickMembers") && !message.channel.permissionsOf(client.user.id).has("kickMembers")) return `${message.author.mention}, I don't have the \`Kick Members\` permission!`;
  const member = message.mentions[0];
  if (member) {
    try {
      await message.channel.guild.kickMember(member.id, `kick command used by @${message.author.username}#${message.author.discriminator}`);
      return `Successfully kicked ${member.mention}.`;
    } catch (error) {
      throw error;
      //return `${message.author.mention}, I was unable to kick the member. Have you given me permissions?`;
    }
  } else {
    return `${message.author.mention}, you need to provide a member to kick!`;
  }
};

exports.category = 2;
exports.help = "Kicks a member";
exports.params = "[mention]";