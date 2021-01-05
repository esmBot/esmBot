const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add radial blur!`;
  const { buffer, type} = await magick.run({
    cmd: "circle",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `circle.${type}`
  };
};

exports.aliases = ["cblur", "radial", "radialblur"];
exports.category = 5;
exports.help = "Applies a radial blur effect on an image";