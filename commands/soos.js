const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to loop!`;
  if (image.type !== "gif") return `${message.author.mention}, that isn't a GIF!`;
  const buffer = await gm(image.path).coalesce().out("-duplicate", "1,-2-1").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: "soos.gif"
  };
};

exports.aliases = ["bounce"];
exports.category = 5;
exports.help = "\"Loops\" a GIF by reversing it when it's finished";