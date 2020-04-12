const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a "who did this" meme!`;
  const template = "./assets/images/whodidthis.png";
  const buffer = await gm(template).out("null:").out("(").out(image.path).coalesce().out(")").gravity("Center").resize("374x374>").out("-layers", "composite").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `wdt.${image.type}`
  };
};

exports.aliases = ["whodidthis"];
exports.category = 5;
exports.help = "Creates a \"WHO DID THIS\" meme from an image";