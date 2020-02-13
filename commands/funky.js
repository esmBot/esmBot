const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add New Funky Mode!`;
  const watermark = "./assets/images/funky.png";
  gm(image.data).size(async (error, size) => {
    if (error) throw error;
    const data = gm(image.data).coalesce().out("null:").out(watermark).gravity("NorthEast").resize(null, size.height).out("-layers", "composite").out("-layers", "optimize");
    return message.channel.createMessage("", {
      file: await gmToBuffer(data),
      name: `funky.${image.type}`
    });
  });
};

exports.aliases = ["funkymode", "newfunkymode", "funkykong"];
exports.category = 5;
exports.help = "Adds the New Funky Mode banner to an image";