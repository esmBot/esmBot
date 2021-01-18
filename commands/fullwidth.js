exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to convert to fullwidth!`;
  return args.join("").replaceAll(/[A-Za-z0-9]/g, (s) => { return String.fromCharCode(s.charCodeAt(0) + 0xFEE0); });
};

exports.aliases = ["aesthetic", "aesthetics", "aes"];
exports.category = 4;
exports.help = "Converts a message to fullwidth/aesthetic text";
exports.params = "[text]";