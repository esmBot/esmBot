const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message, args) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to generate a meme!`;
  const newArgs = args.filter(item => !item.includes(image.url) );
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a meme!`;
  const [topText, bottomText] = newArgs.join(" ").split(/(?<!\\),/).map(elem => elem.trim());
  const buffer = await promisify(magick.meme)(image.path, topText.toUpperCase().replace(/&/g, "\\&amp;").replace(/>/g, "\\&gt;").replace(/</g, "\\&lt;").replace(/"/g, "\\&quot;").replace(/'/g, "\\&apos;"), bottomText ? bottomText.toUpperCase().replace(/&/g, "\\&amp;").replace(/>/g, "\\&gt;").replace(/</g, "\\&lt;").replace(/"/g, "\\&quot;").replace(/'/g, "\\&apos;") : "", image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `meme.${image.type}`
  };
};

exports.category = 5;
exports.help = "Generates a meme from an image (separate top/bottom text with a comma)";
exports.params = "[top text], {bottom text}";