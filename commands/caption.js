const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to add a caption!`;
  const newArgs = args.filter(item => !item.includes(image.url) );
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to add a caption!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const outputFinal = await promisify(magick.caption)(newArgs.join(" "), image.path, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  await processMessage.delete();
  return {
    file: outputFinal,
    name: `caption.${image.type}`
  };
};

exports.aliases = ["gifc", "gcaption", "ifcaption", "ifunnycaption"];
exports.category = 5;
exports.help = "Adds a caption to an image/GIF";