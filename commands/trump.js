const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fetch = require("node-fetch");
const fs = require("fs");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a Trump meme!`;
  message.channel.sendTyping();
  const template = "./assets/images/trump.png";
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  const path = require("tempy").file({
    extension: image.type
  });
  require("util").promisify(fs.writeFile)(path, imageBuffer);
  const command = gm(template).out("-background").out("none").out("-gravity").out("South").out("(").out("-clone").out("0").out("(").out(path).out("-virtual-pixel").out("transparent").out("-resize").out("365x179!").out("+distort").out("Perspective").out("0,0 207,268 365,0 548,271 365,179 558,450 0,179 193,450").out(")").out("-geometry").out("-25-1").out("-composite").out(")").out("+swap").out("-composite");
  const resultBuffer = await gmToBuffer(command);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: "trump.png"
  });
};