const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to speed up!`;
  if (image.type !== "gif") return `${message.author.mention}, that isn't a GIF!`;
  const { buffer, type } = await magick.run({
    cmd: "speed",
    path: image.path
  });
  return {
    file: buffer,
    name: "speed.gif"
  };
};

exports.aliases = ["speedup", "fast", "gifspeed"];
exports.category = 5;
exports.help = "Makes a GIF faster";