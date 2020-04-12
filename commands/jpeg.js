const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add more JPEG!`;
  const buffer = await gm(`${image.path}[0]`).quality(1).bufferPromise("jpg");
  return {
    file: buffer,
    name: "jpeg.jpg"
  };
};

exports.aliases = ["needsmorejpeg", "jpegify", "magik2", "morejpeg", "jpg"];
exports.category = 5;
exports.help = "Adds max JPEG compression to an image";