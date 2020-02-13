const fs = require("fs");
const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to make a motivational poster!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to make a motivational poster!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const [topText, bottomText] = args.join(" ").split(",").map(elem => elem.trim());
  const path = `/tmp/${Math.random().toString(36).substring(2, 15)}.${image.type}`;
  const file = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const file2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const text = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  const text2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  require("util").promisify(fs.writeFile)(path, image.data);
  gm().in("(").in(path).coalesce().resize(500, 500).borderColor("black").border(5, 5).out(")").borderColor("white").border(3, 3).out("-layers", "optimize").write(file, (error) => {
    if (error) throw error;
    gm(file).size((error, size) => {
      if (error) throw error;
      gm(file).coalesce().background("black").gravity("Center").extent(600, size.height + 50).out("+swap").write(file2, () => {
        // this is commented out because it was causing some issues and I couldn't find an elegant solution
        // if (error) throw error;
        gm(file2).size((error, size2) => {
          if (error) throw error;
          gm().background("black").out("-size", "600").fill("white").font("Times").pointSize(56).gravity("Center").out(`pango:${topText}`).gravity("South").out("-splice", bottomText ? "0x0" : "0x20").write(text, (error) => {
            if (error) throw error;
            gm(text).size(async (error, size3) => {
              if (error) throw error;
              const command = gm(file2).gravity("North").coalesce().background("black").extent(600, size2.height + size3.height).out("null:", "(", text, "-set", "page", `+0+${size2.height}`, ")", "-layers", "composite", "-layers", "optimize");
              if (bottomText) {
                gm().background("black").out("-size", "600").fill("white").font("Times").pointSize(28).gravity("Center").out(`pango:${bottomText}`).gravity("South").out("-splice", "0x20").write(text2, (error) => {
                  if (error) throw error;
                  gm(text2).size(async (error, size4) => {
                    if (error) throw error;
                    const command2 = gm(await gmToBuffer(command, image.type)).gravity("North").coalesce().background("black").extent(600, size2.height + size3.height + size4.height).out("null:", "(", text2, "-set", "page", `+0+${size2.height + size3.height}`, ")", "-layers", "composite", "-layers", "optimize");
                    const resultBuffer = await gmToBuffer(command2, image.type);
                    processMessage.delete();
                    return message.channel.createMessage("", {
                      file: resultBuffer,
                      name: `motivate.${image.type}`
                    });
                  });
                });
              } else {
                const resultBuffer = await gmToBuffer(command, image.type);
                processMessage.delete();
                return message.channel.createMessage("", {
                  file: resultBuffer,
                  name: `motivate.${image.type}`
                });
              }
            });
          });
        });
      });
    });
  });
};

exports.aliases = ["motivational", "motiv", "demotiv", "demotivational", "poster"];
exports.category = 5;
exports.help = "Creates a motivational poster";