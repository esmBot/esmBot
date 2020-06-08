const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to spin!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const seq = await gm(image.path).coalesce().out("-duplicate", "29").scale("256x256>").scale("256x256<").out("-alpha", "set").virtualPixel("transparent").out("-distort", "SRT", "%[fx:360*t/n]").set("delay", "5").out("-loop", "0").streamPromise("miff");
  const resultBuffer = await gm(seq).in("-dispose", "background").bufferPromise("gif");
  await processMessage.delete();
  return {
    file: resultBuffer,
    name: "spin.gif"
  };
};

exports.aliases = ["rotate"];
exports.category = 5;
exports.help = "Spins an image";