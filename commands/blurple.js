const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make blurple!`;
  const data = gm(image.path).threshold(75, true).out("+level-colors").out("\"#7289DA\",white");
  return message.channel.createMessage("", {
    file: await gmToBuffer(data, image.outputType),
    name: `blurple.${image.outputType}`
  });
};

exports.aliases = ["blurp"];
exports.category = 5;
exports.help = "Turns an image blurple";