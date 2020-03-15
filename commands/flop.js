const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to flop!`;
  const buffer = await gm(image.path).flop().bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `flop.${image.type}`
  });
};

exports.aliases = ["flip2"];
exports.category = 5;
exports.help = "Flops an image";