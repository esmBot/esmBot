const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a iFunny watermark!`;
  const buffer = await magick.run({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/ifunny.png",
    gravity: 8,
    resize: true,
    append: true,
    type: image.type.toUpperCase(),
    delay: image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0
  });
  return {
    file: buffer,
    name: `ifunny.${image.type}`
  };
};

exports.category = 5;
exports.help = "Adds the iFunny watermark to an image";