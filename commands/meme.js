const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");

exports.run = async (message, args) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to generate a meme!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a meme!`;
  const [topText, bottomText] = args.join(" ").split(",").map(elem => elem.trim());
  const file = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const file2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  const file3 = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  gm(image.path).coalesce().resize(600, 600).noProfile().write(file, (error) => {
    if (error) throw error;
    gm(file).size((error, size) => {
      if (error) throw error;
      gm().out("-size", size.width).background("none").gravity("Center").out("(", "(").font("Impact").out("-pointsize", 40).out(`pango:<span foreground='white'>${topText.toUpperCase().replace(/&/g, "\\&amp;").replace(/>/g, "\\&gt;").replace(/</g, "\\&lt;").replace(/"/g, "\\&quot;").replace(/'/g, "\\&apos;")}</span>`).out(")", "(", "+clone").out("-channel", "A").out("-morphology", "EdgeOut", "Octagon", "+channel", "+level-colors", "black", ")").compose("DstOver").out(")", "-composite").write(file2, (error) => {
        if (error) throw error;
        gm().out("-size", size.width).background("none").gravity("Center").out("(", "(").font("Impact").out("-pointsize", 40).out(`pango:<span foreground='white'>${bottomText ? bottomText.toUpperCase().replace(/&/g, "\\&amp;").replace(/>/g, "\\&gt;").replace(/</g, "\\&lt;").replace(/"/g, "\\&quot;").replace(/'/g, "\\&apos;") : " "}</span>`).out(")", "(", "+clone").out("-channel", "A").out("-morphology", "EdgeOut", "Octagon", "+channel", "+level-colors", "black", ")").compose("DstOver").out(")", "-composite").write(file3, async (error) => {
          if (error) throw error;
          const data = gm(file).out("-coalesce").out("null:").gravity("North").out(file2).out("-layers", "composite").out("null:").gravity("South").out(file3).out("-layers", "composite").out("-layers", "optimize");
          return message.channel.createMessage("", {
            file: await gmToBuffer(data, image.outputType),
            name: `meme.${image.outputType}`
          });
        });
      });
    });
  });
};

exports.category = 5;
exports.help = "Generates a meme from an image (separate top/bottom text with a comma)";
exports.params = "[top text], {bottom text}";