const fs = require("fs");
const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to add a caption!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to add a caption!`;
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  require("util").promisify(fs.writeFile)(path, image.data);
  gm(image.data).size(async (error, size) => {
    if (error) throw error;
    const command = gm().out("-size", `${size.width}x`).background("white").fill("black").font("./assets/caption.otf", size.width / 10).gravity("Center").out(`caption:${args.join(" ")}`);
    const output = await gmToBuffer(command, "png");
    gm(output).size(async (error, size2) => {
      if (error) throw error;
      gm(output).gravity("Center").trim().out("+repage").extent(size.width, size2.height + (size.width / 10)).stream(async (error, output2) => {
        if (error) throw error;
        const command3 = gm(output2).out("-alpha", "set").background("none").out("(").out(path).out("-coalesce").out(")").out("-set", "page", "%[fx:u.w]x%[fx:u.h+v.h]+%[fx:t?(u.w-v.w)/2:0]+%[fx:t?u.h:0]").out("-coalesce").out("null:").out("-insert", 1).out("-layers", "composite").out("-loop", "0");
        const outputFinal = await gmToBuffer(command3, image.type);
        await processMessage.delete();
        return message.channel.createMessage("", {
          file: outputFinal,
          name: `caption.${image.type}`
        });
      });
    });
  });
};

exports.aliases = ["gifc", "gcaption", "ifcaption", "ifunnycaption"];
exports.category = 5;
exports.help = "Adds a caption to an image/GIF";