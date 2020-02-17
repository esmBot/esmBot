const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fs = require("fs");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a GameXplain thumbnail meme!`;
  const template = "./assets/images/gamexplain.png";
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  require("util").promisify(fs.writeFile)(path, image.data);
  const command = gm(template).background("white").out("null:").out("(").out(path).coalesce().out("-virtual-pixel", "transparent").resize("1181x571!").out(")").compose("over").gravity("Center").out("-geometry", "+0+40").out("-layers", "composite").out("-layers", "optimize");
  return message.channel.createMessage("", {
    file: await gmToBuffer(command, image.type),
    name: `gamexplain.${image.type}`
  });
};

exports.aliases = ["gx"];
exports.category = 5;
exports.help = "Makes a GameXplain thumbnail from an image";