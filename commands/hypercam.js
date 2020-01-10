const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Hypercam watermark!`;
  const watermark = "./assets/images/hypercam.png";
  gm(image.data).size(async (error, size) => {
    if (error) throw error;
    const data = gm(image.data).coalesce().out("null:").out(watermark).gravity("NorthWest").resize(null, size.height).out("-layers", "composite").out("-layers", "optimize");
    const resultBuffer = await gmToBuffer(data);
    return message.channel.createMessage("", {
      file: resultBuffer,
      name: `hypercam.${image.type}`
    });
  });
};

exports.aliases = ["hcam"];
exports.category = 5;
exports.help = "Adds the Hypercam watermark to an image";