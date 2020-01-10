const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a 9GAG watermark!`;
  const watermark = "./assets/images/9gag.png";
  const data = gm(image.data).coalesce().out("null:").out(watermark).gravity("East").out("-layers", "composite").out("-layers", "optimize");
  const resultBuffer = await gmToBuffer(data);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `9gag.${image.type}`
  });
};

exports.aliases = ["ninegag", "gag"];
exports.category = 5;
exports.help = "Adds the 9gag watermark to an image";