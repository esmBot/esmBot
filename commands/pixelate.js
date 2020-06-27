const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to pixelate!`;
  const buffer = await gm(image.path).coalesce().scale("10%").coalesce().scale("1000%").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `pixelate.${image.type}`
  };
};

exports.aliases = ["pixel", "small"];
exports.category = 5;
exports.help = "Pixelates an image";