const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to explode!`;
  const { buffer, type } = await magick.run({
    cmd: "explode",
    path: image.path,
    amount: -1,
    type: image.type
  });
  return {
    file: buffer,
    name: `explode.${type}`
  };
};

exports.aliases = ["exp"];
exports.category = 5;
exports.help = "Explodes an image";