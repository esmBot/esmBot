const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to loop!`;
  if (image.type !== "gif") return `${message.author.mention}, that isn't a GIF!`;
  const { buffer, type } = await magick.run({
    cmd: "reverse",
    path: image.path,
    soos: true,
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0
  });
  return {
    file: buffer,
    name: "soos.gif"
  };
};

exports.aliases = ["bounce"];
exports.category = 5;
exports.help = "\"Loops\" a GIF by reversing it when it's finished";