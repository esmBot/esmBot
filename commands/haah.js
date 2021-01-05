const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const { buffer, type } = await magick.run({
    cmd: "mirror",
    path: image.path,
    first: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `haah.${type}`
  };
};

exports.aliases = ["magik4", "mirror2"];
exports.category = 5;
exports.help = "Mirrors the left side of an image onto the right";