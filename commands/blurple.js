const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make blurple!`;
  const buffer = await gm(image.path).threshold(75, true).out("+level-colors").out("\"#7289DA\",white").bufferPromise(image.type);
  return message.channel.createMessage("", {
    file: buffer,
    name: `blurple.${image.type}`
  });
};

exports.aliases = ["blurp"];
exports.category = 5;
exports.help = "Turns an image blurple";