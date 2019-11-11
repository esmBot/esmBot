const sharp = require("sharp");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flop!`;
  message.channel.sendTyping();
  const resultBuffer = await sharp(image.data).flop().toBuffer();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `flop.${image.type}`
  });
};

exports.aliases = ["flip2"];
