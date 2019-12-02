const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add more JPEG!`;
  const data = gm(image.data).setFormat("jpg").quality(1);
  const resultBuffer = await gmToBuffer(data);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: "jpeg.jpg"
  });
};

exports.aliases = ["needsmorejpeg", "jpegify", "magik2", "morejpeg", "jpg"];
exports.category = 5;
exports.help = "Adds max JPEG compression to an image";