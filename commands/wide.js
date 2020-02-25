const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to stretch!`;
  const size = await gm(image.path).sizePromise();
  if (size.width > 10000) return `${message.author.mention}, this image is too wide!`;
  const buffer = await gm(image.path).coalesce().resize(`${(size.width * 19) / 2}x${size.height / 2}!`).bufferPromise(image.type);
  return message.channel.createMessage("", {
    file: buffer,
    name: `wide.${image.type}`
  });
};

exports.aliases = ["w19", "wide19"];
exports.category = 5;
exports.help = "Stretches an image to 19x its width";