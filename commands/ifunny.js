const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a iFunny watermark!`;
  const watermark = "./assets/images/ifunny.png";
  const size = await gm(image.path).sizePromise();
  const buffer = await gm(image.path).coalesce().out("null:").out(watermark).gravity("South").resize(size.width, null).out("-layers", "composite").bufferPromise(image.type);
  return message.channel.createMessage("", {
    file: buffer,
    name: `ifunny.${image.type}`
  });
};

exports.category = 5;
exports.help = "Adds the iFunny watermark to an image";