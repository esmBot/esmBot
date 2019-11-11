const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a 9GAG watermark!`;
  message.channel.sendTyping();
  const watermark = "./assets/images/9gag.png";
  const data = gm(image.data).composite(watermark).gravity("East");
  const resultBuffer = await gmToBuffer(data);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `9gag.${image.type}`
  });
};

exports.aliases = ["ninegag", "gag"];
