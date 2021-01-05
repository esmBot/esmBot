const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to implode!`;
  const { buffer, type } = await magick.run({
    cmd: "explode",
    path: image.path,
    amount: 1,
    type: image.type
  });
  return {
    file: buffer,
    name: `implode.${type}`
  };
};

exports.aliases = ["imp"];
exports.category = 5;
exports.help = "Implodes an image";