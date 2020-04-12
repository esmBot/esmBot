const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to stretch!`;
  const buffer = await gm(image.path).coalesce().resize("512x512!").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `stretch.${image.type}`
  };
};

exports.aliases = ["aspect", "ratio", "aspect43", "43"];
exports.category = 5;
exports.help = "Stretches an image to 4:3 aspect ratio";