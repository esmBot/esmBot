const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flop!`;
  const command = gm(image.path).flop();
  return message.channel.createMessage("", {
    file: await gmToBuffer(command, image.outputType),
    name: `flop.${image.outputType}`
  });
};

exports.aliases = ["flip2"];
exports.category = 5;
exports.help = "Flops an image";