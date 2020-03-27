const gm = require("gm").subClass({
  imageMagick: true
});
  
exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide a GIF to slow down!`;
  if (image.type !== "gif") return `${message.author.mention}, that isn't a GIF!`;
  const value = await gm(image.path).identifyPromise();
  const delay = value.Delay ? value.Delay[0].split("x") : [0, 100];
  const buffer = await gm().delay(`${parseInt(delay[0]) * 2}x${delay[1]}`).out(image.path).bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: "slow.gif"
  });
};
  
exports.aliases = ["slowdown", "slower", "gifspeed2"];
exports.category = 5;
exports.help = "Makes a GIF slower";