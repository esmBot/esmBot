const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const buffer = await magick({
    cmd: "mirror",
    path: image.path,
    vertical: true,
    type: image.type.toUpperCase(),
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0
  });
  return {
    file: buffer,
    name: `hooh.${image.type}`
  };
};

exports.aliases = ["magik6", "mirror4"];
exports.category = 5;
exports.help = "Mirrors the bottom of an image onto the top";