const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fs = require("fs");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a Super Smash Bros. leak meme!`;
  if (image.type === "gif") return `${message.author.mention}, this command doesn't work with GIFs!`;
  const template = "./assets/images/leak.png";
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  require("util").promisify(fs.writeFile)(path, image.data);
  const command = gm(template).out("-background").out("white").out("-gravity").out("Center").out("(").out("-clone").out("0").out("(").out(path).out("-virtual-pixel").out("white").out("-resize").out("640x360!").rotate("white", 15).out(")").out("-geometry").out("+450-200").out("-composite").out(")").out("+swap").out("-composite").out("-alpha").out("remove").out("-alpha").out("off");
  // const command = gm(template).out("-background", "white").gravity("Center").out("null:").out("(").out(path).out("-resize", "640x360!").out("-virtual-pixel", "white").rotate("white", 15).coalesce().geometry("+450-200").out(")").compose("over").out("-alpha", "remove").out("-alpha", "off").out("-layers", "composite");
  const resultBuffer = await gmToBuffer(command, "png");
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: "leak.png"
  });
};

exports.aliases = ["smash", "laxchris", "ssbu", "smashleak"];
exports.category = 5;
exports.help = "Creates a fake Smash leak thumbnail from an image";