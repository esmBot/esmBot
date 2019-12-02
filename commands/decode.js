exports.run = async (message, args) => {
  const b64Decoded = Buffer.from(args.join(" "), "base64").toString("utf-8");
  return `\`\`\`\n${b64Decoded}\`\`\``;
};

exports.aliases = ["b64decode", "base64decode"];
exports.category = 1;
exports.help = "Decodes a Base64 string";