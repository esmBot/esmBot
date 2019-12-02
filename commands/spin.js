const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to spin!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const command = gm(image.data).out("-duplicate", "29").scale("256x256>").scale("256x256<").background("transparent").virtualPixel("background").out("-distort", "SRT", "'%[fx:360*t/n]'").set("delay", "5").set("dispose", "Background").out("-loop", "0");
  const resultBuffer = await gmToBuffer(command, "gif");
  // xc:none -fill white -draw circle 128,128 128,0
  // .out("-layers", "composite")
  await processMessage.delete();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: "spin.gif"
  });
};

exports.aliases = ["rotate"];
exports.category = 5;
exports.help = "Spins an image";