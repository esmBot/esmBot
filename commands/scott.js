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
  const command = gm(template).out("-gravity").out("Center").out("(").out(path).out("-virtual-pixel").out("transparent").out("-resize").out("415x234!").out("+distort").out("Perspective").out("0,0 129,187 415,0 517,182 415,234 517,465 0,234 132,418").out("-geometry").out("-110+83").out(")").out("-composite");
  const resultBuffer = await gmToBuffer(command, "png");
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: "scott.png"
  });
};

exports.aliases = ["woz", "tv", "porn"];
exports.category = 5;
exports.help = "Creates a Scott the Woz TV image";