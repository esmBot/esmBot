const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message, args) => {
  message.channel.sendTyping();
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image to generate a meme!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate a meme!`;
  const [topText, bottomText] = args.join(" ").split(/(?<!\\),/).map(elem => elem.trim());
  const file = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const file2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  const file3 = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  await gm(image.path).coalesce().scale(600, 600).noProfile().writePromise(file);
  await gm(file).out("-size", "%[fx:u.w]").out("-delete", "0--1").background("none").gravity("Center").out("(", "(").font("Impact").out("-pointsize", 40).out(`pango:<span foreground='white'>${topText.toUpperCase().replace(/&/g, "\\&amp;").replace(/>/g, "\\&gt;").replace(/</g, "\\&lt;").replace(/"/g, "\\&quot;").replace(/'/g, "\\&apos;")}</span>`).out(")", "(", "+clone").out("-alpha", "extract").out("-morphology", "EdgeOut", "Octagon", "-background", "black", "-alpha", "shape", ")").compose("DstOver").out(")", "-composite").writePromise(file2);
  if (bottomText) await gm(file).out("-size", "%[fx:u.w]").out("-delete", "0--1").background("none").gravity("Center").out("(", "(").font("Impact").out("-pointsize", 40).out(`pango:<span foreground='white'>${bottomText.toUpperCase().replace(/&/g, "\\&amp;").replace(/>/g, "\\&gt;").replace(/</g, "\\&lt;").replace(/"/g, "\\&quot;").replace(/'/g, "\\&apos;")}</span>`).out(")", "(", "+clone").out("-alpha", "extract").out("-morphology", "EdgeOut", "Octagon", "-background", "black", "-alpha", "shape", ")").compose("DstOver").out(")", "-composite").writePromise(file3);
  const buffer = await gm(file).out("-coalesce").out("null:").gravity("North").out(file2).out("-layers", "composite").out("null:").gravity("South").out(bottomText ? file3 : "null:").out("-layers", "composite").bufferPromise(image.type, image.delay);
  return {
    file: buffer,
    name: `meme.${image.type}`
  };
};

exports.category = 5;
exports.help = "Generates a meme from an image (separate top/bottom text with a comma)";
exports.params = "[top text], {bottom text}";