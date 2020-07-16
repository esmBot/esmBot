const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a GameXplain thumbnail meme!`;
  const buffer = await promisify(magick.gamexplain)(image.path, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `gamexplain.${image.type}`
  };
};

exports.aliases = ["gx"];
exports.category = 5;
exports.help = "Makes a GameXplain thumbnail from an image";