const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Bandicam watermark!`;
  const watermark = "./assets/images/bandicam.png";
  gm(image.data).size(async (error, size) => {
    if (error) throw error;
    const data = gm(image.data).coalesce().out("null:").out(watermark).gravity("North").resize(null, size.height).out("-layers", "composite").out("-layers", "optimize");
    return message.channel.createMessage("", {
      file: await gmToBuffer(data),
      name: `bandicam.${image.type}`
    });
  });
};

exports.aliases = ["bandi"];
exports.category = 5;
exports.help = "Adds the Bandicam watermark to an image";