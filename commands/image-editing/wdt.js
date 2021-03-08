const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a "who did this" meme!`;
  const { buffer, type } = await magick.run({
    cmd: "wdt",
    path: image.path,
    type: image.type
  });
  return {
    file: buffer,
    name: `wdt.${type}`
  };
};

exports.aliases = ["whodidthis"];
exports.category = 5;
exports.help = "Creates a \"WHO DID THIS\" meme from an image";