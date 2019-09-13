const sharp = require("sharp");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flop!`;
  message.channel.sendTyping();
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  const resultBuffer = await sharp(imageBuffer).flop().toBuffer();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `flop.${image.type}`
  });
};

exports.aliases = ["flip2"];
