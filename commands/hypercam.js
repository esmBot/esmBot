const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Hypercam watermark!`;
  const buffer = await promisify(magick.watermark)(image.path, "./assets/images/hypercam.png", 1, true, false, false, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `hypercam.${image.type}`
  };
};

exports.aliases = ["hcam"];
exports.category = 5;
exports.help = "Adds the Hypercam watermark to an image";