const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const data = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const size = await gm(image.path).sizePromise();
  await gm(image.path).coalesce().gravity("South").crop(0, "50%").out("+repage").writePromise(data);
  // const buffer = await gm(data2).extent("%[fx:u.w]", "%[fx:u.h*2]").out("null:").out(data).gravity("North").out("-layers", "Composite").bufferPromise(image.type, image.delay);
  const buffer = await gm(data).extent(size.width, size.height).out("null:").out("(").out(data).flip().out(")").geometry(`+0+${size.height / 2}`).out("-layers", "Composite").bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `hooh.${image.type}`
  });
};

exports.aliases = ["magik6", "mirror4"];
exports.category = 5;
exports.help = "Mirrors the bottom of an image onto the top";