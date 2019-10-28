// really don't like this file

const gm = require("gm").subClass({
  imageMagick: true
});
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  message.channel.sendTyping();
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  const data = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  const data2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  gm(imageBuffer).gravity("North").crop(0, "50%").strip().write(data2, (error) => {
    if (error) console.error;
    gm(data2).flip().strip().write(data, async (error) => {
      if (error) console.error;
      gm(data2).append(data).toBuffer(image.type, (error, resultBuffer) => {
        if (error) console.error;
        return message.channel.createMessage("", {
          file: resultBuffer,
          name: `woow.${image.type}`
        });
      });
    });
  });
};

exports.aliases = ["magik5", "mirror3"];
