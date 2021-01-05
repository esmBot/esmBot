const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to pixelate!`;
  const { buffer, type } = await magick.run({
    cmd: "resize",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `pixelate.${type}`
  };
};

exports.aliases = ["pixel", "small"];
exports.category = 5;
exports.help = "Pixelates an image";