const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add some magik!`;
  if (image.type === "gif") return `${message.author.mention}, this command doesn't work with GIFs!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const stream = await gm(image.path).coalesce().resize(600, 600).streamPromise("miff");
  const stream2 = await gm(stream).out("-liquid-rescale", "300x300").streamPromise();
  const resultBuffer = await gm(stream2).out("-liquid-rescale", "800x800").bufferPromise(image.type);
  await processMessage.delete();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `magik.${image.type}`
  });
};

exports.aliases = ["imagemagic", "imagemagick", "imagemagik", "magic", "magick", "cas", "liquid"];
exports.category = 5;
exports.help = "Adds a content aware scale effect to an image";