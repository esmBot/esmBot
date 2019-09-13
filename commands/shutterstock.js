const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Shutterstock watermark!`;
  message.channel.sendTyping();
  const watermark = "./assets/images/shutterstock.png";
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  gm(imageBuffer).size(async (error, size) => {
    if (error) console.error;
    const command = gm(imageBuffer).composite(watermark).gravity("Center").resize(null, size.height);
    const output = await gmToBuffer(command);
    return message.channel.createMessage("", {
      file: output,
      name: "shutterstock.png"
    });
  });
};

exports.aliases = ["stock", "stockphoto"];