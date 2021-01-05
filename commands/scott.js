const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a Scott the Woz TV meme!`;
  const { buffer, type } = await magick.run({
    cmd: "scott",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `scott.${type}`
  };
};

exports.aliases = ["woz", "tv", "porn"];
exports.category = 5;
exports.help = "Creates a Scott the Woz TV image";