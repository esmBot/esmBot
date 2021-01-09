const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to speed up!`;
  const { buffer, type } = await magick.run({
    cmd: "speed",
    path: image.path,
    onlyGIF: true,
    type: image.type
  });
  if (type === "nogif") return `${message.author.mention}, that isn't a GIF!`;
  return {
    file: buffer,
    name: `speed.${type}`
  };
};

exports.aliases = ["speedup", "fast", "gifspeed"];
exports.category = 5;
exports.help = "Makes a GIF faster";