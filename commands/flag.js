const magick = require("../utils/image.js");
const fs = require("fs");
const emojiRegex = require("emoji-regex");
const emoji = require("node-emoji");

exports.run = async (message, args) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to overlay a flag onto!`;
  if (args.length === 0 || !args[0].match(emojiRegex)) return `${message.author.mention}, you need to provide an emoji of a flag to overlay!`;
  const flag = emoji.unemojify(args[0]).replaceAll(":", "").replace("flag-", "");
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
  const { buffer, type } = await magick.run({
    cmd: "flag",
    path: image.path,
    overlay: path,
    type: image.type
  });
  return {
    file: buffer,
    name: `flag.${type}`
  };
};

exports.params = "[flag]";
exports.category = 5;
exports.help = "Overlays a flag onto an image";