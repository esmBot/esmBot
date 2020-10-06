const magick = require("../utils/image.js");
const fs = require("fs");
const emojiRegex = require("emoji-regex");
const emoji = require("node-emoji");

exports.run = async (message, args) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to overlay a flag onto!`;
  if (!args[0].match(emojiRegex)) return `${message.author.mention}, you need to provide an emoji of a flag to overlay!`;
  const flag = emoji.unemojify(args[0]).replace(/:/g, "").replace("flag-", "");
  let path = `./assets/images/region-flags/png/${flag.toUpperCase()}.png`;
  if (flag === "🏴‍☠️") path = "./assets/images/pirateflag.png";
  if (flag === "rainbow-flag") path = "./assets/images/rainbowflag.png";
  if (flag === "checkered_flag") path = "./assets/images/checkeredflag.png";
  if (flag === "🏳️‍⚧️") path = "./assets/images/transflag.png";
  try {
    await fs.promises.access(path);
  } catch (e) {
    return `${message.author.mention}, that isn't a flag!`;
  }
  const buffer = await magick.run({
    cmd: "flag",
    path: image.path,
    overlay: path,
    type: image.type.toUpperCase(),
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0
  });
  return {
    file: buffer,
    name: `flag.${image.type}`
  };
};

exports.params = "[flag]";
exports.category = 5;
exports.help = "Overlays a flag onto an image";