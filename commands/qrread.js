const jsqr = require("jsqr");
const sharp = require("sharp");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image with a QR code to read it!`;
  message.channel.sendTyping();
  const rawData = await sharp(image.data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const qrBuffer = jsqr(rawData.data, rawData.info.width, rawData.info.height);
  return `\`\`\`\n${qrBuffer.data}\n\`\`\``;
};