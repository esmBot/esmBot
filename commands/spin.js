const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to spin!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  //const seq = await gm(image.path).coalesce().out("-duplicate", "29").scale("256x256>").scale("256x256<").out("-alpha", "set").virtualPixel("transparent").out("-distort", "SRT", "%[fx:360*t/n]").set("delay", "5").out("-loop", "0").streamPromise("miff");
  //const resultBuffer = await gm(seq).in("-dispose", "background").bufferPromise("gif");
  const buffer = await promisify(magick.spin)(image.path, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  await processMessage.delete();
  return {
    file: buffer,
    name: "spin.gif"
  };
};

exports.aliases = ["rotate"];
exports.category = 5;
exports.help = "Spins an image";