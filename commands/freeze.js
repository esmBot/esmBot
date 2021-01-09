const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to freeze!`;
  const { buffer, type } = await magick.run({
    cmd: "freeze",
    path: image.path,
    loop: false,
    onlyGIF: true,
    type: image.type
  });
  if (type === "nogif") return `${message.author.mention}, that isn't a GIF!`;
  return {
    file: buffer,
    name: `freeze.${type}`
  };
};

exports.aliases = ["noloop", "once"];
exports.category = 5;
exports.help = "Makes a GIF only play once";