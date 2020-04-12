const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to mirror!`;
  const data = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  await gm(image.path).coalesce().gravity("West").crop("50%", 0).out("+repage").writePromise(data);
  const buffer = await gm(data).extent("%[fx:u.w*2]", "%[fx:u.h]").out("null:").out("(").out(data).flop().out(")").gravity("East").out("-layers", "Composite").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `haah.${image.type}`
  };
};

exports.aliases = ["magik4", "mirror2"];
exports.category = 5;
exports.help = "Mirrors the left side of an image onto the right";