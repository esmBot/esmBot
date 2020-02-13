const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Shutterstock watermark!`;
  const watermark = "./assets/images/shutterstock.png";
  gm(image.data).size(async (error, size) => {
    if (error) throw error;
    const command = gm(image.data).coalesce().out("null:").out(watermark).gravity("Center").resize(null, size.height).out("-layers", "composite").out("-layers", "optimize");
    return message.channel.createMessage("", {
      file: await gmToBuffer(command),
      name: `shutterstock.${image.type}`
    });
  });
};

exports.aliases = ["stock", "stockphoto"];
exports.category = 5;
exports.help = "Adds the Shutterstock watermark to an image";