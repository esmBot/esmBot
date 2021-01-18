const magick = require("../utils/image.js");
const wrap = require("../utils/wrap.js");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to make a Sonic meme!`;
  message.channel.sendTyping();
  const cleanedMessage = args.join(" ").replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%");
  const { buffer } = await magick.run({
    cmd: "sonic",
    text: wrap(cleanedMessage, {width: 15, indent: ""})
  });
  return {
    file: buffer,
    name: "sonic.png"
  };
};

exports.category = 4;
exports.help = "Creates a Sonic speech bubble image";
exports.params = "[text]";