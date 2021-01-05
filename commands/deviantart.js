const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a DeviantArt watermark!`;
  const { buffer, type } = await magick.run({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/deviantart.png",
    gravity: 5,
    resize: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `deviantart.${type}`
  };
};

exports.aliases = ["da", "deviant"];
exports.category = 5;
exports.help = "Adds a DeviantArt watermark to an image";