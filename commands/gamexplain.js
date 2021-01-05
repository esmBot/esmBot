const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a GameXplain thumbnail meme!`;
  const { buffer, type } = await magick.run({
    cmd: "gamexplain",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `gamexplain.${type}`
  };
};

exports.aliases = ["gx"];
exports.category = 5;
exports.help = "Makes a GameXplain thumbnail from an image";