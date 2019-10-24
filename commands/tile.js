const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const fetch = require("node-fetch");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to tile!`;
  message.channel.sendTyping();
  const imageData = await fetch(image.url);
  const imageBuffer = await imageData.buffer();
  gm(imageBuffer).command("montage").out("-duplicate").out(24).tile("5x5").geometry("+0+0").stream(async (error, output) => {
    if (error) console.error;
    const data = gm(output).resize("800x800>");
    const resultBuffer = await gmToBuffer(data);
    return message.channel.createMessage("", {
      file: resultBuffer,
      name: `tile.${image.type}`
    });
  });
};

exports.aliases = ["wall2"];
