const client = require("../utils/client.js");

exports.run = async (message, args) => {
  const getUser = message.mentions.length >= 1 ? message.mentions[0] : (args.length !== 0 ? client.users.get(args[0]) : message.author);
  let user;
  if (getUser) {
    user = getUser;
  } else if (args.join(" ") !== "") {
    const userRegex = new RegExp(args.join("|"), "i");
    const member = client.users.find(element => {
      return userRegex.test(element.username);
    });
    user = member ? member : message.author;
  } else {
    user = message.author;
  }
  //const user = getUser !== undefined ? getUser : (message.author);
  const member = message.channel.guild ? message.channel.guild.members.get(user.id) : undefined;
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
          "value": member ? (member.nick ? member.nick : "None") : "N/A"
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
          "value": member ? new Date(member.joinedAt).toString() : "N/A"
        },
        {
          "name": "ℹ️ **Status:**",
          "value": member && member.status ? member.status : "Unknown"
        }
      ]
    }
  };
  return infoEmbed;
};

exports.aliases = ["user"];
exports.category = 1;
exports.help = "Gets info about a user";
exports.params = "{mention/id}";