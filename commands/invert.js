const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to invert!`;
  const buffer = await gm(image.path).coalesce().negative().bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `invert.${image.type}`
  });
};

exports.aliases = ["inverse", "negate", "negative"];
exports.category = 5;
exports.help = "Inverts an image's colors";