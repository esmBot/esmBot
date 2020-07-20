const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a 9GAG watermark!`;
  const buffer = await promisify(magick.watermark)(image.path, "./assets/images/9gag.png", 6, false, false, false, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `9gag.${image.type}`
  };
};

exports.aliases = ["ninegag", "gag"];
exports.category = 5;
exports.help = "Adds the 9gag watermark to an image";