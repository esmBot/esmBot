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
    if (error) console.error;
    const data = gm(image.data).composite(watermark).gravity("NorthEast").resize(null, size.height);
    const resultBuffer = await gmToBuffer(data);
    return message.channel.createMessage("", {
      file: resultBuffer,
      name: `funky.${image.type}`
    });
  });
};

exports.aliases = ["funkymode", "newfunkymode", "funkykong"];
exports.category = 5;
exports.help = "Adds the New Funky Mode banner to an image";