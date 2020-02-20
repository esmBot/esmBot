const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a "who did this" meme!`;
  const template = "./assets/images/whodidthis.png";
  const command = gm(template).coalesce().out("null:").out(image.path).gravity("Center").resize("374x374>").out("-layers", "composite");
  const buffer = await gmToBuffer(command, image.outputType);
  return message.channel.createMessage("", {
    file: buffer,
    name: `wdt.${image.outputType}`
  });
};

exports.aliases = ["whodidthis"];
exports.category = 5;
exports.help = "Creates a \"WHO DID THIS\" meme from an image";