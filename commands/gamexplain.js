const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a GameXplain thumbnail meme!`;
  const template = "./assets/images/gamexplain.png";
  const buffer = await gm(template).background("white").out("null:").out("(").out(image.path).coalesce().out("-virtual-pixel", "transparent").scale("1181x571!").out(")").compose("over").gravity("Center").out("-geometry", "+0+40").out("-layers", "composite").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `gamexplain.${image.type}`
  };
};

exports.aliases = ["gx"];
exports.category = 5;
exports.help = "Makes a GameXplain thumbnail from an image";