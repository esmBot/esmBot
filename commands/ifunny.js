const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a iFunny watermark!`;
  const buffer = await promisify(magick.watermark)(image.path, "./assets/images/ifunny.png", 8, true, true, false, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `ifunny.${image.type}`
  };
};

exports.category = 5;
exports.help = "Adds the iFunny watermark to an image";