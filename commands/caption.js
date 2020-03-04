const gm = require("gm").subClass({
  imageMagick: true
});
//const upload = require("../utils/upload.js");

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to add a caption!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to add a caption!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const output = await gm(image.path).out("-size", "%[fx:w]x").background("white").fill("black").font("./assets/caption.otf", "%[fx:w/10]").out("-delete", "0--1").gravity("Center").out(`caption:${args.join(" ")}`).bufferPromise("png");
  const output2 = await gm(output).out(image.path).gravity("Center").trim().out("+repage").extent("%[fx:v.w]", "%[fx:u.h + ( v.w/10 )]").out("-delete", "1--1").streamPromise();
  const outputFinal = await gm(output2).out("-alpha", "set").background("none").out("(").out(image.path).out("-coalesce").out(")").colorspace("sRGB").out("-set", "page", "%[fx:v.w]x%[fx:u.h+v.h]+%[fx:t?(u.w-v.w)/2:0]+%[fx:t?u.h:0]").out("-coalesce").out("null:").out("-insert", 1).out("-layers", "composite").bufferPromise(image.type);
  await processMessage.delete();
  //return upload(message, outputFinal, `caption.${image.type}`);
  return message.channel.createMessage("", {
    file: outputFinal,
    name: `caption.${image.type}`
  });
};

exports.aliases = ["gifc", "gcaption", "ifcaption", "ifunnycaption"];
exports.category = 5;
exports.help = "Adds a caption to an image/GIF";
