const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to crop!`;
  const { buffer, type } = await magick.run({
    cmd: "crop",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `crop.${type}`
  };
};

exports.category = 5;
exports.help = "Crops an image to 1:1";