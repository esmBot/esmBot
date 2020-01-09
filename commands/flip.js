const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flip!`;
  const command = gm(image.data).flip();
  const resultBuffer = await gmToBuffer(command);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `flip.${image.type}`
  });
};

exports.category = 5;
exports.help = "Flips an image";