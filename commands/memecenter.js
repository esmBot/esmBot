const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a MemeCenter watermark!`;
  const watermark = "./assets/images/memecenter.png";
  const output = await gm(image.path).coalesce().background("white").extent("%[fx:u.w]", "%[fx:u.h+15]").out("null:").out(watermark).gravity("SouthEast").compose("over").out("-layers", "composite").bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: output,
    name: `memecenter.${image.type}`
  });
};

exports.aliases = ["memec", "mcenter"];
exports.category = 5;
exports.help = "Adds the MemeCenter watermark to an image";