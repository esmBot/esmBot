const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to explode!`;
  message.channel.sendTyping();
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  const data = gm(imageBuffer).implode([-2]);
  const resultBuffer = await gmToBuffer(data);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `explode.${image.type}`
  });
};

exports.aliases = ["exp"];
