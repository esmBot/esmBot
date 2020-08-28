const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Hypercam watermark!`;
  const buffer = await magick({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/hypercam.png",
    gravity: 1,
    resize: true,
    type: image.type.toUpperCase(),
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0
  });
  return {
    file: buffer,
    name: `hypercam.${image.type}`
  };
};

exports.aliases = ["hcam"];
exports.category = 5;
exports.help = "Adds the Hypercam watermark to an image";