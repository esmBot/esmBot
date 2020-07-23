const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to stretch!`;
  const buffer = await promisify(magick.resize)(image.path, true, false, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `stretch.${image.type}`
  };
};

exports.aliases = ["aspect", "ratio", "aspect43", "43"];
exports.category = 5;
exports.help = "Stretches an image to 4:3 aspect ratio";