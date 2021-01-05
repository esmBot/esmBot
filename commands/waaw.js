const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const { buffer, type } = await magick.run({
    cmd: "mirror",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `waaw.${type}`
  };
};

exports.aliases = ["magik3", "mirror"];
exports.category = 5;
exports.help = "Mirrors the right side of an image onto the left";