const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to swirl!`;
  const data = gm(image.path).coalesce().swirl(180);
  return message.channel.createMessage("", {
    file: await gmToBuffer(data, image.outputType),
    name: `swirl.${image.outputType}`
  });
};

exports.aliases = ["whirlpool"];
exports.category = 5;
exports.help = "Swirls an image";