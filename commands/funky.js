const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add New Funky Mode!`;
  const watermark = "./assets/images/funky.png";
  const buffer = await gm(image.path).coalesce().out("null:").out(watermark).gravity("NorthEast").resize(null, "%[fx:u.h]").out("-layers", "composite").bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `funky.${image.type}`
  });
};

exports.aliases = ["funkymode", "newfunkymode", "funkykong"];
exports.category = 5;
exports.help = "Adds the New Funky Mode banner to an image";