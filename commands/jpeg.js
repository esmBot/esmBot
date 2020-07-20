const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add more JPEG!`;
  const buffer = await promisify(magick.jpeg)(image.path);
  return {
    file: buffer,
    name: "jpeg.jpg"
  };
};

exports.aliases = ["needsmorejpeg", "jpegify", "magik2", "morejpeg", "jpg"];
exports.category = 5;
exports.help = "Adds max JPEG compression to an image";