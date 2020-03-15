const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to implode!`;
  const buffer = await gm(image.path).implode([1]).bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `implode.${image.type}`
  });
};

exports.aliases = ["imp"];
exports.category = 5;
exports.help = "Implodes an image";