const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fs = require("fs");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a "who did this" meme!`;
  const template = "./assets/images/whodidthis.png";
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  require("util").promisify(fs.writeFile)(path, image.data);
  const command = gm(template).coalesce().out("null:").out(path).gravity("Center").resize("374x374>").out("-layers", "composite");
  const resultBuffer = await gmToBuffer(command, image.type);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `wdt.${image.type}`
  });
};

exports.aliases = ["whodidthis"];
exports.category = 5;
exports.help = "Creates a \"WHO DID THIS\" meme from an image";