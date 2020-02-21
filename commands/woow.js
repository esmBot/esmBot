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
  const size = await gm(image.path).sizePromise();
  await gm(image.path).coalesce().gravity("North").crop(0, "50%").out("+repage").writePromise(data2);
  await gm(data2).flip().writePromise(data);
  const command = gm(data2).extent(size.width, size.height).out("null:").out(data).geometry(`+0+${size.height / 2}`).out("-layers", "Composite");
  const buffer = await gmToBuffer(command, image.outputType);
  return message.channel.createMessage("", {
    file: buffer,
    name: `woow.${image.outputType}`
  });
};

exports.aliases = ["magik5", "mirror3"];
exports.category = 5;
exports.help = "Mirrors the top of an image onto the bottom";