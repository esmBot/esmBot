const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make a wall from!`;
  gm(image.path).coalesce().resize(128).stream("miff", async (error, output) => {
    if (error) throw error;
    const data = gm(output).coalesce().virtualPixel("tile").matteColor("none").out("-background", "none").resize("512x512!").out("-distort").out("Perspective").out("0,0,57,42 0,128,63,130 128,0,140,60 128,128,140,140");
    return message.channel.createMessage("", {
      file: await gmToBuffer(data, image.outputType),
      name: `wall.${image.outputType}`
    });
  });
};

exports.category = 5;
exports.help = "Creates a wall from an image";