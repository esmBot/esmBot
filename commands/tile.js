const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to tile!`;
  const { buffer, type } = await magick.run({
    cmd: "tile",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `tile.${type}`
  };
};

exports.aliases = ["wall2"];
exports.category = 5;
exports.help = "Creates a tile pattern from an image";