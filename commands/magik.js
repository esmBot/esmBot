const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add some magik!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  gm(imageBuffer).resize(800, 800).stream((error, stream) => {
    if (error) console.error;
    gm(stream).out("-liquid-rescale", "400x400").stream(async (error, stream2) => {
      if (error) console.error;
      const data = gm(stream2).out("-liquid-rescale", "1200x1200");
      const resultBuffer = await gmToBuffer(data);
      await processMessage.delete();
      return message.channel.createMessage("", {
        file: resultBuffer,
        name: `magik.${image.type}`
      });
    });
  });
};

exports.aliases = ["imagemagic", "imagemagick", "imagemagik", "magic", "magick", "cas", "liquid"];
