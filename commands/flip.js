const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flip!`;
  const buffer = await gm(image.path).flip().bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `flip.${image.type}`
  };
};

exports.category = 5;
exports.help = "Flips an image";