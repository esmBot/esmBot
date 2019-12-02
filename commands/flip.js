const sharp = require("sharp");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flip!`;
  const resultBuffer = await sharp(image.data).flip().toBuffer();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `flip.${image.type}`
  });
};

exports.category = 5;
exports.help = "Flips an image";