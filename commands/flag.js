const gm = require("gm").subClass({
  imageMagick: true
});
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
  const size = await gm(image.path).sizePromise();
  const buffer = await gm(image.path).coalesce().out("null:").out("(", path, "-alpha", "set", "-channel", "A", "-evaluate", "multiply", "0.5", "+channel", ")").gravity("North").scale(...(size.width < size.height ? ["%[fx:u.w]", null] : [null, "%[fx:u.h]"])).out("-layers", "composite").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `flag.${image.type}`
  };
};

exports.params = "[flag]";
exports.category = 5;
exports.help = "Overlays a flag onto an image";