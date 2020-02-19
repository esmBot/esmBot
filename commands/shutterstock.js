const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Shutterstock watermark!`;
  const watermark = "./assets/images/shutterstock.png";
  gm(image.path).size(async (error, size) => {
    if (error) throw error;
    const command = gm(image.path).coalesce().out("null:").out(watermark).gravity("Center").resize(null, size.height).out("-layers", "composite").out("-layers", "optimize");
    const buffer = await gmToBuffer(command, image.outputType);
    return message.channel.createMessage("", {
      file: buffer,
      name: `shutterstock.${image.outputType}`
    });
  });
};

exports.aliases = ["stock", "stockphoto"];
exports.category = 5;
exports.help = "Adds the Shutterstock watermark to an image";