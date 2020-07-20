const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a MemeCenter watermark!`;
  const buffer = await promisify(magick.watermark)(image.path, "./assets/images/memecenter.png", 9, false, false, true, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `memecenter.${image.type}`
  };
};

exports.aliases = ["memec", "mcenter"];
exports.category = 5;
exports.help = "Adds the MemeCenter watermark to an image";