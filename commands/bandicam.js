const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Bandicam watermark!`;
  const { buffer, type } = await magick.run({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/bandicam.png",
    gravity: 2,
    resize: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `bandicam.${type}`
  };
};

exports.aliases = ["bandi"];
exports.category = 5;
exports.help = "Adds the Bandicam watermark to an image";