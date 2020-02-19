const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to explode!`;
  const data = gm(image.path).coalesce().implode([-2]);
  const buffer = await gmToBuffer(data, image.outputType);
  return message.channel.createMessage("", {
    file: buffer,
    name: `explode.${image.outputType}`
  });
};

exports.aliases = ["exp"];
exports.category = 5;
exports.help = "Explodes an image";