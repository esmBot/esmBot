const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Bandicam watermark!`;
  const watermark = "./assets/images/bandicam.png";
  gm(image.path).size(async (error, size) => {
    if (error) throw error;
    const data = gm(image.path).coalesce().out("null:").out(watermark).gravity("North").resize(null, size.height).out("-layers", "composite").out("-layers", "optimize");
    const buffer = await gmToBuffer(data, image.outputType);
    return message.channel.createMessage("", {
      file: buffer,
      name: `bandicam.${image.outputType}`
    });
  });
};

exports.aliases = ["bandi"];
exports.category = 5;
exports.help = "Adds the Bandicam watermark to an image";