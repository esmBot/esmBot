const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to explode!`;
  const buffer = await gm(image.path).coalesce().implode([-2]).bufferPromise(image.type);
  return message.channel.createMessage("", {
    file: buffer,
    name: `explode.${image.type}`
  });
};

exports.aliases = ["exp"];
exports.category = 5;
exports.help = "Explodes an image";