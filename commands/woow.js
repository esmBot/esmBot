// really don't like this file

const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const data = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  const data2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  gm(image.data).gravity("North").crop(0, "50%").strip().write(data2, (error) => {
    if (error) throw error;
    gm(data2).flip().strip().write(data, async (error) => {
      if (error) throw error;
      gm(data2).append(data).toBuffer(image.type, (error, resultBuffer) => {
        if (error) throw error;
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