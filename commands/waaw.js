// really don't like this file

const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const data = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const data2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  gm(image.path).size((error, size) => {
    if (error) throw error;
    gm(image.path).coalesce().gravity("East").crop("50%", 0).out("+repage").write(data2, (error) => {
      if (error) throw error;
      gm(data2).flop().write(data, async (error) => {
        if (error) throw error;
        const command = gm(data2).extent(size.width, size.height).out("null:").out(data).geometry(`+${size.width / 2}+0`).out("-layers", "Composite");
        const buffer = await gmToBuffer(command, image.outputType);
        return message.channel.createMessage("", {
          file: buffer,
          name: `waaw.${image.outputType}`
        });
      });
    });
  });
};

exports.aliases = ["magik3", "mirror"];
exports.category = 5;
exports.help = "Mirrors the right side of an image onto the left";
