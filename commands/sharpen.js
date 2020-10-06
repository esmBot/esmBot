const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to sharpen!`;
  const buffer = await magick.run({
    cmd: "sharpen",
    path: image.path,
    sharp: true,
    type: image.type.toUpperCase(),
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0
  });
  return {
    file: buffer,
    name: `sharpen.${image.type}`
  };

};

exports.aliases = ["sharp"];
exports.category = 5;
exports.help = "Sharpens an image";