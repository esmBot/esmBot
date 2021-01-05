const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a Super Smash Bros. leak meme!`;
  const { buffer, type } = await magick.run({
    cmd: "leak",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `leak.${type}`
  };
};

exports.aliases = ["smash", "laxchris", "ssbu", "smashleak"];
exports.category = 5;
exports.help = "Creates a fake Smash leak thumbnail from an image";