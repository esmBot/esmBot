const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a MemeCenter watermark!`;
  message.channel.sendTyping();
  const watermark = "./assets/images/memecenter.png";
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  let resultBuffer;
  gm(imageBuffer).size(async (error, size) => {
    if (error) console.error;
    const command = gm(imageBuffer).out(watermark).background("#FFFFFF").gravity("East").out("-smush").out("-9");
    const output = await gmToBuffer(command);
    gm(output).size(async (error, size2) => {
      if (error) console.error;
      resultBuffer = output;
      if (size.width !== size2.width) {
        const command2 = gm(output).gravity("West").chop(size2.width - size.width, 0);
        resultBuffer = await gmToBuffer(command2);
      }
      return message.channel.createMessage("", {
        file: resultBuffer,
        name: "memecenter.png"
      });
    });
  });
};

exports.aliases = ["memec", "mcenter"];