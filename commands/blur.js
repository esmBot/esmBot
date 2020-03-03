const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to blur!`;
  const buffer = await gm(image.path).coalesce().blur(15).bufferPromise(image.type);
  return message.channel.createMessage("", {
    file: buffer,
    name: `blur.${image.type}`
  });
};

exports.category = 5;
exports.help = "Blurs an image";