const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to invert!`;
  const data = gm(image.path).negative();
  return message.channel.createMessage("", {
    file: await gmToBuffer(data, image.outputType),
    name: `invert.${image.outputType}`
  });
};

exports.aliases = ["inverse", "negate", "negative"];
exports.category = 5;
exports.help = "Inverts an image's colors";