const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to tile!`;
  const output = await gm(image.path).coalesce().command("montage").out("-duplicate").out(24).tile("5x5").geometry("+0+0").streamPromise("miff");
  const buffer = await gm(output).coalesce().resize("800x800>").bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `tile.${image.type}`
  });
};

exports.aliases = ["wall2"];
exports.category = 5;
exports.help = "Creates a tile pattern from an image";