exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide a string to encode!`;
  const b64Encoded = Buffer.from(args.join(" ")).toString("base64");
  return `\`\`\`\n${b64Encoded}\`\`\``;
};

exports.aliases = ["b64encode", "base64encode"];
exports.category = 1;
exports.help = "Encodes a Base64 string";
exports.params = "[text]";