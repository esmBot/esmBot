const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a DeviantArt watermark!`;
  const watermark = "./assets/images/deviantart.png";
  gm(image.data).size(async (error, size) => {
    if (error) throw error;
    const data = gm(image.data).coalesce().out("null:").out(watermark).gravity("Center").resize(null, size.height).out("-layers", "composite");
    const resultBuffer = await gmToBuffer(data);
    return message.channel.createMessage("", {
      file: resultBuffer,
      name: `deviantart.${image.type}`
    });
  });
};

exports.aliases = ["da", "deviant"];
exports.category = 5;
exports.help = "Adds a DeviantArt watermark to an image";