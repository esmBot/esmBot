const sharp = require("sharp");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to sharpen!`;
  const resultBuffer = await sharp(image.data).sharpen(5).toBuffer();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: "sharpen.png"
  });

};

exports.aliases = ["sharp"];
exports.category = 5;
exports.help = "Sharpens an image";