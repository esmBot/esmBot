const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a iFunny watermark!`;
  message.channel.sendTyping();
  const watermark = "./assets/images/ifunny.png";
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  gm(imageBuffer).size(async (error, size) => {
    if (error) console.error;
    const data = gm(imageBuffer).append(watermark).gravity("South").resize(size.width, null);
    const resultBuffer = await gmToBuffer(data);
    return message.channel.createMessage("", {
      file: resultBuffer,
      name: `ifunny.${image.type}`
    });
  });
};
