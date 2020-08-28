const magick = require("../utils/image.js");
const { clean } = require("../utils/misc.js");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image with a QR code to read!`;
  message.channel.sendTyping();
  const {qrText, missing} = await magick({
    cmd: "qrread",
    path: image.path
  });
  if (missing) return `${message.author.mention}, I couldn't find a QR code!`;
  return `\`\`\`\n${await clean(qrText)}\n\`\`\``;
};

exports.category = 1;
exports.help = "Reads a QR code";