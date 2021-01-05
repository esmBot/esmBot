const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a 9GAG watermark!`;
  const { buffer, type } = await magick.run({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/9gag.png",
    gravity: 6,
    type: image.type
  });
  return {
    file: buffer,
    name: `9gag.${type}`
  };
};

exports.aliases = ["ninegag", "gag"];
exports.category = 5;
exports.help = "Adds the 9gag watermark to an image";