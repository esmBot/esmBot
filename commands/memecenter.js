const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a MemeCenter watermark!`;
  const { buffer, type } = await magick.run({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/memecenter.png",
    gravity: 9,
    mc: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `memecenter.${type}`
  };
};

exports.aliases = ["memec", "mcenter"];
exports.category = 5;
exports.help = "Adds the MemeCenter watermark to an image";