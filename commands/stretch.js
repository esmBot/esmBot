const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to stretch!`;
  const data = gm(image.path).coalesce().resize("512x512!");
  return message.channel.createMessage("", {
    file: await gmToBuffer(data, image.outputType),
    name: `stretch.${image.outputType}`
  });
};

exports.aliases = ["aspect", "ratio", "aspect43", "43"];
exports.category = 5;
exports.help = "Stretches an image to 4:3 aspect ratio";