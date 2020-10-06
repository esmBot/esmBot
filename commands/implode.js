const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to implode!`;
  const buffer = await magick.run({
    cmd: "explode",
    path: image.path,
    amount: 1,
    type: image.type.toUpperCase(),
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0
  });
  return {
    file: buffer,
    name: `implode.${image.type}`
  };
};

exports.aliases = ["imp"];
exports.category = 5;
exports.help = "Implodes an image";