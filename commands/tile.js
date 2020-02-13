const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to tile!`;
  gm(image.data).command("montage").out("-duplicate").out(24).tile("5x5").geometry("+0+0").stream(async (error, output) => {
    if (error) throw error;
    const data = gm(output).resize("800x800>");
    return message.channel.createMessage("", {
      file: await gmToBuffer(data),
      name: `tile.${image.type}`
    });
  });
};

exports.aliases = ["wall2"];
exports.category = 5;
exports.help = "Creates a tile pattern from an image";