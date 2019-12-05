const client = require("../utils/client.js");

exports.run = async (message, args) => {
  if (message.mentions[0] !== undefined) {
    return message.mentions[0].avatarURL;
  } else if (client.users.get(args[0]) !== undefined) {
    return client.users.get(args[0]).avatarURL;
  } else {
    return message.author.avatarURL;
  }
};

exports.aliases = ["pfp", "ava"];
exports.category = 1;
exports.help = "Gets a user's avatar";
exports.params = "{mention/id}";