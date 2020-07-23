const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to tile!`;
  //const output = await gm(image.path).coalesce().command("montage").out("-duplicate").out(24).tile("5x5").geometry("+0+0").streamPromise("miff");
  //const buffer = await gm(output).coalesce().resize("800x800>").bufferPromise(image.type, image.delay);
  const buffer = await promisify(magick.tile)(image.path, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  return {
    file: buffer,
    name: `tile.${image.type}`
  };
};

exports.aliases = ["wall2"];
exports.category = 5;
exports.help = "Creates a tile pattern from an image";