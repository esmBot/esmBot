const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to explode!`;
  const data = gm(image.data).implode([-2]);
  const resultBuffer = await gmToBuffer(data);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `explode.${image.type}`
  });
};

exports.aliases = ["exp"];
exports.category = 5;
exports.help = "Explodes an image";