const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const data = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const data2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const size = await gm(image.path).sizePromise();
  await gm(image.path).coalesce().gravity("East").crop("50%", 0).out("+repage").writePromise(data2);
  await gm(data2).flop().writePromise(data);
  // const buffer = await gm(data2).extent("%[fx:u.w*2]", "%[fx:u.h]").out("null:").out(data).gravity("West").out("-layers", "Composite").bufferPromise(image.type);
  const buffer = await gm(data2).extent(size.width, size.height).out("null:").out(data).geometry(`+${size.width / 2}+0`).out("-layers", "Composite").bufferPromise(image.type);
  return message.channel.createMessage("", {
    file: buffer,
    name: `waaw.${image.type}`
  });
};

exports.aliases = ["magik3", "mirror"];
exports.category = 5;
exports.help = "Mirrors the right side of an image onto the left";