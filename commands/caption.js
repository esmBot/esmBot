const gm = require("gm").subClass({
  imageMagick: true
});
//const upload = require("../utils/upload.js");

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to add a caption!`;
  const newArgs = args.filter(item => !item.includes(image.url) );
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to add a caption!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const size = await gm(image.path).sizePromise();
  const output = await gm().out("-size", `${size.width - ((size.width / 25) * 2)}x`).background("white").fill("black").font("./assets/caption.otf", size.width / 10).gravity("Center").out(`caption:${newArgs.join(" ")}`).extent(size.width, `%[fx:h+${size.width / 25}]`).bufferPromise("png");
  const size2 = await gm(output).sizePromise();
  //const output2 = await gm(output).gravity("Center").trim().out("+repage").extent(size.width, size2.height + (size.width / 10)).streamPromise();
  const outputFinal = await gm(output).in("(").gravity("Center").trim().out("+repage").extent(size.width, size2.height + (size.width / 10)).out(")").background("white").out("-alpha", "set").out("(").out(image.path).out("-coalesce").out(")").colorspace("sRGB").out("-set", "page", "%[fx:u.w]x%[fx:u.h+v.h]+%[fx:t?(u.w-v.w)/2:0]+%[fx:t?u.h:0]").out("-coalesce").out("null:").out("-insert", 1).out("-layers", "composite").bufferPromise(image.type, image.delay);
  await processMessage.delete();
  //return upload(message, outputFinal, `caption.${image.type}`);
  return {
    file: outputFinal,
    name: `caption.${image.type}`
  };
};

exports.aliases = ["gifc", "gcaption", "ifcaption", "ifunnycaption"];
exports.category = 5;
exports.help = "Adds a caption to an image/GIF";