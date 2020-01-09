const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fs = require("fs");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a Scott the Woz TV meme!`;
  const template = "./assets/images/scott.png";
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  require("util").promisify(fs.writeFile)(path, image.data);
  const command = gm(template).out("null:").out("(").out(path).out("-virtual-pixel", "transparent").resize("415x234!").coalesce().out("+distort", "Perspective", "0,0 129,187 415,0 517,182 415,234 517,465 0,234 132,418").out(")").compose("over").gravity("Center").geometry("-238-98").out("-layers", "composite");
  const resultBuffer = await gmToBuffer(command, image.type);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `scott.${image.type}`
  });
};

exports.aliases = ["woz", "tv", "porn"];
exports.category = 5;
exports.help = "Creates a Scott the Woz TV image";