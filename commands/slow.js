const magick = require("../utils/image.js");
  
exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to slow down!`;
  const { buffer, type } = await magick.run({
    cmd: "speed",
    path: image.path,
    slow: true,
    onlyGIF: true,
    type: image.type
  });
  if (type === "nogif") return `${message.author.mention}, that isn't a GIF!`;
  return {
    file: buffer,
    name: `slow.${type}`
  };
};
  
exports.aliases = ["slowdown", "slower", "gifspeed2"];
exports.category = 5;
exports.help = "Makes a GIF slower";