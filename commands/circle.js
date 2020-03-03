const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add radial blur!`;
  const buffer = await gm(image.path).coalesce().out("-rotational-blur", 10).bufferPromise(image.type);
  return message.channel.createMessage("", {
    file: buffer,
    name: `circle.${image.type}`
  });
};

exports.aliases = ["cblur", "radial", "radialblur"];
exports.category = 5;
exports.help = "Applies a radial blur effect on an image";