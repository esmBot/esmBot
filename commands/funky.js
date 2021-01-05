const magick = require("../utils/image.js");

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add New Funky Mode!`;
  const { buffer, type } = await magick.run({
    cmd: "watermark",
    path: image.path,
    water: "./assets/images/funky.png",
    gravity: 3,
    resize: true,
    type: image.type
  });
  return {
    file: buffer,
    name: `funky.${type}`
  };
};

exports.aliases = ["funkymode", "newfunkymode", "funkykong"];
exports.category = 5;
exports.help = "Adds the New Funky Mode banner to an image";