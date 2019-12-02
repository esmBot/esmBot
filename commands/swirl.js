const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to swirl!`;
  const data = gm(image.data).swirl(180);
  const resultBuffer = await gmToBuffer(data);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `swirl.${image.type}`
  });
};

exports.aliases = ["whirlpool"];
exports.category = 5;
exports.help = "Swirls an image";