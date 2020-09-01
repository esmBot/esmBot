const client = require("../utils/client.js");

exports.run = async (message, args) => {
  if (message.mentions[0] !== undefined) {
    return message.mentions[0].dynamicAvatarURL(null, 1024);
  } else if (client.users.get(args[0]) !== undefined) {
    return client.users.get(args[0]).dynamicAvatarURL(null, 1024);
  } else if (args.join(" ") !== "" && message.channel.guild) {
    const userRegex = new RegExp(args.join("|"), "i");
    const member = message.channel.guild.members.find(element => {
      return userRegex.test(element.nick) ? userRegex.test(element.nick) : userRegex.test(element.username);
    });
    return member ? member.user.dynamicAvatarURL(null, 1024) : message.author.dynamicAvatarURL(null, 1024);
  } else {
    return message.author.dynamicAvatarURL(null, 1024);
  }
};

exports.aliases = ["pfp", "ava"];
exports.category = 1;
exports.help = "Gets a user's avatar";
exports.params = "{mention/id}";