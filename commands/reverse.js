const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to reverse!`;
  if (image.type !== "gif") return `${message.author.mention}, that isn't a GIF!`;
  const buffer = await gm(image.path).coalesce().out("-reverse").bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: "reverse.gif"
  });
};

exports.aliases = ["backwards"];
exports.category = 5;
exports.help = "Reverses a GIF";