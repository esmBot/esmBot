const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image with a QR code to read!`;
  message.channel.sendTyping();
  const {qrText, missing} = await promisify(magick.qrread)(image.path);
  if (missing) return `${message.author.mention}, I couldn't find a QR code!`;
  return `\`\`\`\n${qrText}\n\`\`\``;
};

exports.category = 1;
exports.help = "Reads a QR code";