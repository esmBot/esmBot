const magick = require("../utils/image.js");

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to add a caption!`;
  const newArgs = args.filter(item => !item.includes(image.url) );
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to add a caption!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const { buffer, type } = await magick.run({
    cmd: "caption",
    path: image.path,
    caption: newArgs.join(" ").replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%"),
    type: image.type
  });
  if (processMessage.channel.messages.get(processMessage.id)) await processMessage.delete();
  return {
    file: buffer,
    name: `caption.${type}`
  };
};

exports.aliases = ["gifc", "gcaption", "ifcaption", "ifunnycaption"];
exports.category = 5;
exports.help = "Adds a caption to an image/GIF";