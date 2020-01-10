const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fs = require("fs");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a Trump meme!`;
  const template = "./assets/images/trump.png";
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  require("util").promisify(fs.writeFile)(path, image.data);
  const command = gm(template).background("white").out("null:").out("(").out(path).out("-virtual-pixel", "transparent").resize("365x179!").coalesce().out("+distort", "Perspective", "0,0 207,268 365,0 548,271 365,179 558,450 0,179 193,450").out(")").compose("over").gravity("Center").geometry("-217-135").out("-layers", "composite").out("-layers", "optimize");
  const resultBuffer = await gmToBuffer(command, image.type);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `trump.${image.type}`
  });
};

exports.category = 5;
exports.help = "Makes Trump display an image";