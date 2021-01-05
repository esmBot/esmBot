const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to blur!`;
  const { buffer, type } = await magick.run({
    cmd: "blur",
    path: image.path,
    sharp: false,
    type: image.type
  });
  return {
    file: buffer,
    name: `blur.${type}`
  };
};

exports.category = 5;
exports.help = "Blurs an image";