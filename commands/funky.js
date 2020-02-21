const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add New Funky Mode!`;
  const watermark = "./assets/images/funky.png";
  const size = await gm(image.path).sizePromise();
  const data = gm(image.path).coalesce().out("null:").out(watermark).gravity("NorthEast").resize(null, size.height).out("-layers", "composite");
  const buffer = await gmToBuffer(data, image.outputType);
  return message.channel.createMessage("", {
    file: buffer,
    name: `funky.${image.outputType}`
  });
};

exports.aliases = ["funkymode", "newfunkymode", "funkykong"];
exports.category = 5;
exports.help = "Adds the New Funky Mode banner to an image";