const magick = require("../utils/image.js");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add some magik!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const { buffer, type } = await magick.run({
    cmd: "magik",
    path: image.path,
    type: image.type
  });
  if (processMessage.channel.messages.get(processMessage.id)) await processMessage.delete();
  return {
    file: buffer,
    name: `magik.${type}`
  };
};

exports.aliases = ["imagemagic", "imagemagick", "imagemagik", "magic", "magick", "cas", "liquid"];
exports.category = 5;
exports.help = "Adds a content aware scale effect to an image";