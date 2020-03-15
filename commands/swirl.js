const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to swirl!`;
  const buffer = await gm(image.path).coalesce().swirl(180).bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `swirl.${image.type}`
  });
};

exports.aliases = ["whirlpool"];
exports.category = 5;
exports.help = "Swirls an image";