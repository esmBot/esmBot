const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Hypercam watermark!`;
  const { buffer, type } = await magick.run({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/hypercam.png",
    gravity: 1,
    resize: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `hypercam.${type}`
  };
};

exports.aliases = ["hcam"];
exports.category = 5;
exports.help = "Adds the Hypercam watermark to an image";