const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to loop!`;
  const { buffer, type } = await magick.run({
    cmd: "freeze",
    path: image.path,
    loop: true,
    onlyGIF: true
  });
  if (buffer === "nogif") return `${message.author.mention}, that isn't a GIF!`;
  return {
    file: buffer,
    name: `loop.${type}`
  };
};

exports.aliases = ["unfreeze"];
exports.category = 5;
exports.help = "Makes a GIF loop endlessly";