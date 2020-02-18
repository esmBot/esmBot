const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to sharpen!`;
  const command = gm(image.path).coalesce().sharpen(10);
  return message.channel.createMessage("", {
    file: await gmToBuffer(command, image.outputType),
    name: `sharpen.${image.outputType}`
  });

};

exports.aliases = ["sharp"];
exports.category = 5;
exports.help = "Sharpens an image";