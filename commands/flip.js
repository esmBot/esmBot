const sharp = require("sharp");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flip!`;
  message.channel.sendTyping();
  const resultBuffer = await sharp(image.data).flip().toBuffer();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `flip.${image.type}`
  });
};
