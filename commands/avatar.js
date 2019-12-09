const client = require("../utils/client.js");

exports.run = async (message, args) => {
  if (message.mentions[0] !== undefined) {
    return message.mentions[0].avatarURL;
  } else if (client.users.get(args[0]) !== undefined) {
    return client.users.get(args[0]).avatarURL;
  } else if (args.join(" ") !== "") {
    const userRegex = new RegExp(args.join("|"), "i");
    const member = message.channel.guild.members.find(element => {
      return userRegex.test(element.nick) ? userRegex.test(element.nick) : userRegex.test(element.username);
    });
    return member ? member.avatarURL : message.author.avatarURL;
  } else {
    return message.author.avatarURL;
  }
};

exports.aliases = ["pfp", "ava"];
exports.category = 1;
exports.help = "Gets a user's avatar";
exports.params = "{mention/id}";