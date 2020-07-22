const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Shutterstock watermark!`;
  const buffer = await promisify(magick.watermark)(image.path, "./assets/images/shutterstock.png", 5, true, false, false, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `shutterstock.${image.type}`
  };
};

exports.aliases = ["stock", "stockphoto"];
exports.category = 5;
exports.help = "Adds the Shutterstock watermark to an image";