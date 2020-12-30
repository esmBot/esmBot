const { clean } = require("../utils/misc.js");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide a string to decode!`;
  const b64Decoded = Buffer.from(args.join(" "), "base64").toString("utf-8");
  return `\`\`\`\n${await clean(b64Decoded)}\`\`\``;
};

exports.aliases = ["b64decode", "base64decode"];
exports.category = 1;
exports.help = "Decodes a Base64 string";
exports.params = "[text]";