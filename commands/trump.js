const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a Trump meme!`;
  //const buffer = await gm(template).background("white").out("null:").out("(").out(image.path).coalesce().out("-virtual-pixel", "transparent").resize("365x179!").out("+distort", "Perspective", "0,0 207,268 365,0 548,271 365,179 558,450 0,179 193,450").out(")").compose("over").gravity("Center").geometry("-217-135").out("-layers", "composite").bufferPromise(image.type, image.delay);
  const buffer = await promisify(magick.trump)(image.path, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `trump.${image.type}`
  };
};

exports.category = 5;
exports.help = "Makes Trump display an image";