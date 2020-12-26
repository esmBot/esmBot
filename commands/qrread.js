const jsqr = require("jsqr");
const fetch = require("node-fetch");
const sharp = require("sharp");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image with a QR code to read!`;
  message.channel.sendTyping();
  const data = await (await fetch(image.path)).buffer();
  const rawData = await sharp(data).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const qrBuffer = jsqr(rawData.data, rawData.info.width, rawData.info.height);
  if (!qrBuffer) return `${message.author.mention}, I couldn't find a QR code!`;
  return `\`\`\`\n${qrBuffer.data}\n\`\`\``;
};

exports.category = 1;
exports.help = "Reads a QR code";