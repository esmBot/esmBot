const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to stretch!`;
  const { buffer, type } = await magick.run({
    cmd: "resize",
    path: image.path,
    wide: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `wide.${type}`
  };
};

exports.aliases = ["w19", "wide19"];
exports.category = 5;
exports.help = "Stretches an image to 19x its width";