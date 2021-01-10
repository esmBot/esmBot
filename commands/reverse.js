const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to reverse!`;
  const { buffer, type } = await magick.run({
    cmd: "reverse",
    path: image.path,
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0,
    onlyGIF: true,
    type: image.type
  });
  if (type === "nogif") return `${message.author.mention}, that isn't a GIF!`;
  return {
    file: buffer,
    name: `reverse.${type}`
  };
};

exports.aliases = ["backwards"];
exports.category = 5;
exports.help = "Reverses a GIF";