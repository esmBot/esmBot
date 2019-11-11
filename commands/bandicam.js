const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Bandicam watermark!`;
  message.channel.sendTyping();
  const watermark = "./assets/images/bandicam.png";
  gm(image.data).size(async (error, size) => {
    if (error) console.error;
    const data = gm(image.data).composite(watermark).gravity("North").resize(null, size.height);
    const resultBuffer = await gmToBuffer(data);
    return message.channel.createMessage("", {
      file: resultBuffer,
      name: `bandicam.${image.type}`
    });
  });
};

exports.aliases = ["bandi"];
