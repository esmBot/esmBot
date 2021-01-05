const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to sharpen!`;
  const { buffer, type } = await magick.run({
    cmd: "blur",
    path: image.path,
    sharp: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `sharpen.${type}`
  };

};

exports.aliases = ["sharp"];
exports.category = 5;
exports.help = "Sharpens an image";