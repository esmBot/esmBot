const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to invert!`;
  const { buffer, type } = await magick.run({
    cmd: "invert",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `invert.${type}`
  };
};

exports.aliases = ["inverse", "negate", "negative"];
exports.category = 5;
exports.help = "Inverts an image's colors";