const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a 9GAG watermark!`;
  const watermark = "./assets/images/9gag.png";
  const buffer = await gm(image.path).coalesce().out("null:").out(watermark).gravity("East").out("-layers", "composite").bufferPromise(image.type);
  return message.channel.createMessage("", {
    file: buffer,
    name: `9gag.${image.type}`
  });
};

exports.aliases = ["ninegag", "gag"];
exports.category = 5;
exports.help = "Adds the 9gag watermark to an image";