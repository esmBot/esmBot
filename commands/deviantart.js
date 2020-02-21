const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a DeviantArt watermark!`;
  const watermark = "./assets/images/deviantart.png";
  const size = await gm(image.path).sizePromise();
  const data = gm(image.path).coalesce().out("null:").out(watermark).gravity("Center").resize(null, size.height).out("-layers", "composite");
  const buffer = await gmToBuffer(data, image.outputType);
  return message.channel.createMessage("", {
    file: buffer,
    name: `deviantart.${image.outputType}`
  });
};

exports.aliases = ["da", "deviant"];
exports.category = 5;
exports.help = "Adds a DeviantArt watermark to an image";