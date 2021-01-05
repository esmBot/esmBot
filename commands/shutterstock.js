const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a Shutterstock watermark!`;
  const { buffer, type } = await magick.run({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/shutterstock.png",
    gravity: 5,
    resize: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `shutterstock.${type}`
  };
};

exports.aliases = ["stock", "stockphoto"];
exports.category = 5;
exports.help = "Adds the Shutterstock watermark to an image";