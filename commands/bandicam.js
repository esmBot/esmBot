const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Bandicam watermark!`;
  const watermark = "./assets/images/bandicam.png";
  const buffer = await gm(image.path).coalesce().out("null:").out(watermark).gravity("North").resize(null, "%[fx:u.h]").out("-layers", "composite").bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `bandicam.${image.type}`
  });
};

exports.aliases = ["bandi"];
exports.category = 5;
exports.help = "Adds the Bandicam watermark to an image";