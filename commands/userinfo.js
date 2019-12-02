const client = require("../utils/client.js");

exports.run = async (message, args) => {
  const getUser = message.mentions.length >= 1 ? message.mentions[0] : (args.length !== 0 ? client.users.get(args[0]) : message.author);
  const user = getUser !== undefined ? getUser : message.author;
  const member = message.channel.guild.members.get(user.id);
  const infoEmbed = {
    "embed": {
      "title": `${user.username}#${user.discriminator}`,
      "thumbnail": {
        "url": user.avatarURL
      },
      "color": 16711680,
      "fields": [
        {
          "name": "🔢 **ID:**",
          "value": user.id
        },
        {
          "name": "📛 **Nickname:**",
          "value": member.nick ? member.nick : "None"
        },
        {
          "name": "🤖 **Bot:**",
          "value": user.bot ? "Yes" : "No"
        },
        {
          "name": "🗓️ **Joined Discord on:**",
          "value": new Date(user.createdAt).toString()
        },
        {
          "name": "💬 **Joined this server on:**",
          "value": new Date(member.joinedAt).toString()
        },
        {
          "name": "ℹ️ **Status:**",
          "value": member.status
        },
        {
          "name": "🎮 **Playing:**",
          "value": member.game ? member.game.name : "Nothing"
        }
      ]
    }
  };
  return message.channel.createMessage(infoEmbed);
};

exports.aliases = ["user"];
exports.category = 1;
exports.help = "Gets info about a user";