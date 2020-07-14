const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a DeviantArt watermark!`;
  const buffer = await promisify(magick.watermark)(image.path, "./assets/images/deviantart.png", 5, true, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `deviantart.${image.type}`
  };
};

exports.aliases = ["da", "deviant"];
exports.category = 5;
exports.help = "Adds a DeviantArt watermark to an image";