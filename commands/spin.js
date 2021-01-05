const magick = require("../utils/image.js");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to spin!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const { buffer } = await magick.run({
    cmd: "spin",
    path: image.path,
    type: image.type
  });
  if (processMessage.channel.messages.get(processMessage.id)) await processMessage.delete();
  return {
    file: buffer,
    name: "spin.gif"
  };
};

exports.aliases = ["rotate"];
exports.category = 5;
exports.help = "Spins an image";