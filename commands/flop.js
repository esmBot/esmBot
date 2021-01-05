const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flop!`;
  const { buffer, type } = await magick.run({
    cmd: "flip",
    path: image.path,
    flop: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `flop.${type}`
  };
};

exports.aliases = ["flip2"];
exports.category = 5;
exports.help = "Flops an image";