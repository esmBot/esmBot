const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const { buffer, type } = await magick.run({
    cmd: "mirror",
    path: image.path,
    vertical: true,
    first: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `woow.${type}`
  };
};

exports.aliases = ["magik5", "mirror3"];
exports.category = 5;
exports.help = "Mirrors the top of an image onto the bottom";