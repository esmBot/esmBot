const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to swirl!`;
  const { buffer, type } = await magick.run({
    cmd: "swirl",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `swirl.${type}`
  };
};

exports.aliases = ["whirlpool"];
exports.category = 5;
exports.help = "Swirls an image";