const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flop!`;
  const buffer = await magick.run({
    cmd: "flip",
    path: image.path,
    flop: true,
    type: image.type.toUpperCase(),
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0
  });
  return {
    file: buffer,
    name: `flop.${image.type}`
  };
};

exports.aliases = ["flip2"];
exports.category = 5;
exports.help = "Flops an image";