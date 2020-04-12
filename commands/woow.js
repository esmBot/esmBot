const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const data = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const data2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  await gm(image.path).coalesce().gravity("North").crop(0, "50%").out("+repage").writePromise(data2);
  await gm(data2).flip().writePromise(data);
  const buffer = await gm(data2).extent("%[fx:u.w]", "%[fx:u.h*2]").out("null:").out(data).gravity("South").out("-layers", "Composite").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `woow.${image.type}`
  };
};

exports.aliases = ["magik5", "mirror3"];
exports.category = 5;
exports.help = "Mirrors the top of an image onto the bottom";