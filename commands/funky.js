const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add New Funky Mode!`;
  const buffer = await promisify(magick.watermark)(image.path, "./assets/images/funky.png", 3, true, false, false, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `funky.${image.type}`
  };
};

exports.aliases = ["funkymode", "newfunkymode", "funkykong"];
exports.category = 5;
exports.help = "Adds the New Funky Mode banner to an image";