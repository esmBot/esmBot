const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a wall from!`;
  const { buffer, type } = await magick.run({
    cmd: "wall",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `wall.${type}`
  };
};

exports.category = 5;
exports.help = "Creates a wall from an image";