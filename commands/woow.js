// really don't like this file

const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const data = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  const data2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  gm(image.data).size((error, size) => {
    if (error) throw error;
    gm(image.data).gravity("North").crop(0, "50%").out("+repage").write(data2, (error) => {
      if (error) throw error;
      gm(data2).flip().write(data, async (error) => {
        if (error) throw error;
        const command = gm(data2).out("-repage", `${size.width}x${size.height}`).coalesce().out("null:").out("(").out(data).coalesce().out(")").geometry(`+0+${size.height / 2}`).out("-layers", "Composite");
        const resultBuffer = await gmToBuffer(command);
        return message.channel.createMessage("", {
          file: resultBuffer,
          name: `woow.${image.type}`
        });
      });
    });
  });
};

exports.aliases = ["magik5", "mirror3"];
exports.category = 5;
exports.help = "Mirrors the top of an image onto the bottom";