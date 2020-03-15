const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to add a iFunny watermark!`;
  const watermark = "./assets/images/ifunny.png";
  const buffer = await gm(image.path).coalesce().extent("%[fx:u.w]", "%[fx:u.h+(42*min(u.w/1024,u.h/42))]").out("null:").out(watermark).gravity("South").resize("%[fx:u.w]", null).out("-layers", "composite").bufferPromise(image.type, image.delay);
  return message.channel.createMessage("", {
    file: buffer,
    name: `ifunny.${image.type}`
  });
};

exports.category = 5;
exports.help = "Adds the iFunny watermark to an image";