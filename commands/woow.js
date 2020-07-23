const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const buffer = await promisify(magick.mirror)(image.path, true, true, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `woow.${image.type}`
  };
};

exports.aliases = ["magik5", "mirror3"];
exports.category = 5;
exports.help = "Mirrors the top of an image onto the bottom";