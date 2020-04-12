const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to sharpen!`;
  const buffer = await gm(image.path).coalesce().sharpen(10).bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `sharpen.${image.type}`
  };

};

exports.aliases = ["sharp"];
exports.category = 5;
exports.help = "Sharpens an image";