const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to make blurple!`;
  message.channel.sendTyping();
  const data = gm(image.data).threshold(75, true).out("+level-colors").out("\"#7289DA\",white");
  const resultBuffer = await gmToBuffer(data);
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `blurple.${image.type}`
  });
};

exports.aliases = ["blurp"];
