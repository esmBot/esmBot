const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fetch = require("node-fetch");
const fs = require("fs");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a "who did this" meme!`;
  message.channel.sendTyping();
  const template = "./assets/images/whodidthis.png";
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  require("util").promisify(fs.writeFile)(path, imageBuffer);
  const command = gm(template).composite(path).gravity("Center").geometry("374x374+0+0");
  const resultBuffer = await gmToBuffer(command);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: "wdt.png"
  });
};

exports.aliases = ["whodidthis"];