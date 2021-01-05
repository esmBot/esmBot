const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make blurple!`;
  const { buffer, type } = await magick.run({
    cmd: "blurple",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `blurple.${type}`
  };
};

exports.aliases = ["blurp"];
exports.category = 5;
exports.help = "Turns an image blurple";