const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add New Funky Mode!`;
  const watermark = "./assets/images/funky.png";
  gm(image.path).size(async (error, size) => {
    if (error) throw error;
    const data = gm(image.path).coalesce().out("null:").out(watermark).gravity("NorthEast").resize(null, size.height).out("-layers", "composite").out("-layers", "optimize");
    const buffer = await gmToBuffer(data, image.outputType);
    return message.channel.createMessage("", {
      file: buffer,
      name: `funky.${image.outputType}`
    });
  });
};

exports.aliases = ["funkymode", "newfunkymode", "funkykong"];
exports.category = 5;
exports.help = "Adds the New Funky Mode banner to an image";