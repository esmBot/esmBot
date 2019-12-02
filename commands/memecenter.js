const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a MemeCenter watermark!`;
  const watermark = "./assets/images/memecenter.png";
  let resultBuffer;
  gm(image.data).size(async (error, size) => {
    if (error) console.error;
    const command = gm(image.data).out(watermark).background("#FFFFFF").gravity("East").out("-smush").out("-9");
    const output = await gmToBuffer(command, "png");
    gm(output).size(async (error, size2) => {
      if (error) console.error;
      resultBuffer = output;
      if (size.width !== size2.width) {
        const command2 = gm(output).gravity("West").chop(size2.width - size.width, 0);
        resultBuffer = await gmToBuffer(command2);
      }
      return message.channel.createMessage("", {
        file: resultBuffer,
        name: `memecenter.${image.type}`
      });
    });
  });
};

exports.aliases = ["memec", "mcenter"];
exports.category = 5;
exports.help = "Adds the MemeCenter watermark to an image";