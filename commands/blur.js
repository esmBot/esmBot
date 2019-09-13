const sharp = require("sharp");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to blur!`;
  message.channel.sendTyping();
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  const resultBuffer = await sharp(imageBuffer).blur(5).toBuffer();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `blur.${image.type}`
  });
};
