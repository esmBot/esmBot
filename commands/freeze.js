const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to freeze!`;
  if (image.type !== "gif") return `${message.author.mention}, that isn't a GIF!`;
  const buffer = await gm(image.path).loop(1).bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `freeze.${image.type}`
  };
};

exports.aliases = ["noloop", "once"];
exports.category = 5;
exports.help = "Makes a GIF only play once";