const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Shutterstock watermark!`;
  message.channel.sendTyping();
  const watermark = "./assets/images/shutterstock.png";
  gm(image.data).size(async (error, size) => {
    if (error) console.error;
    const command = gm(image.data).composite(watermark).gravity("Center").resize(null, size.height);
    const output = await gmToBuffer(command);
    return message.channel.createMessage("", {
      file: output,
      name: `shutterstock.${image.type}`
    });
  });
};

exports.aliases = ["stock", "stockphoto"];