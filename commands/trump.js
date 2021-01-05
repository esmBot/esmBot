const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a Trump meme!`;
  const { buffer, type } = await magick.run({
    cmd: "trump",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `trump.${type}`
  };
};

exports.category = 5;
exports.help = "Makes Trump display an image";