const sharp = require("sharp");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flop!`;
  const resultBuffer = await sharp(image.data).flop().toBuffer();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `flop.${image.type}`
  });
};

exports.aliases = ["flip2"];
exports.category = 5;
exports.help = "Flops an image";