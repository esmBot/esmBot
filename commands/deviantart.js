const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a DeviantArt watermark!`;
  const watermark = "./assets/images/deviantart.png";
  const buffer = await gm(image.path).coalesce().out("null:").out(watermark).gravity("Center").scale(null, "%[fx:u.h]").out("-layers", "composite").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `deviantart.${image.type}`
  };
};

exports.aliases = ["da", "deviant"];
exports.category = 5;
exports.help = "Adds a DeviantArt watermark to an image";