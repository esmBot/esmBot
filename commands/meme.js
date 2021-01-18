const magick = require("../utils/image.js");

exports.run = async (message, args) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to generate a meme!`;
  const newArgs = args.filter(item => !item.includes(image.url) );
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a meme!`;
  const [topText, bottomText] = newArgs.join(" ").split(/(?<!\\),/).map(elem => elem.trim());
  const { buffer, type } = await magick.run({
    cmd: "meme",
    path: image.path,
    top: topText.toUpperCase().replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%"),
    bottom: bottomText ? bottomText.toUpperCase().replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%") : "",
    type: image.type
  });
  return {
    file: buffer,
    name: `meme.${type}`
  };
};

exports.category = 5;
exports.help = "Generates a meme from an image (separate top/bottom text with a comma)";
exports.params = "[top text], {bottom text}";