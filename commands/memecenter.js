const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a MemeCenter watermark!`;
  const watermark = "./assets/images/memecenter.png";
  let resultBuffer;
  const size = await gm(image.path).sizePromise();
  const output = await gm(image.path).coalesce().background("white").extent(size.width, size.height + 15).out("null:").out(watermark).gravity("SouthEast").compose("over").out("-layers", "composite").bufferPromise(image.type);
  const size2 = await gm(output).sizePromise();
  resultBuffer = output;
  if (size.width !== size2.width) {
    resultBuffer = await gm(output).gravity("West").chop(size2.width - size.width, 0).bufferPromise(image.type);
  }
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `memecenter.${image.type}`
  });
};

exports.aliases = ["memec", "mcenter"];
exports.category = 5;
exports.help = "Adds the MemeCenter watermark to an image";