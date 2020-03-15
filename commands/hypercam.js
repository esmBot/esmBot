const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Hypercam watermark!`;
  const watermark = "./assets/images/hypercam.png";
  const buffer = await gm(image.path).coalesce().out("null:").out(watermark).gravity("NorthWest").resize(null, "%[fx:u.h]").out("-layers", "composite").bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `hypercam.${image.type}`
  });
};

exports.aliases = ["hcam"];
exports.category = 5;
exports.help = "Adds the Hypercam watermark to an image";