const gm = require("gm").subClass({
  imageMagick: true
});

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to make a motivational poster!`;
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to make a motivational poster!`;
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const [topText, bottomText] = args.join(" ").split(",").map(elem => elem.trim());
  const file = `/tmp/${Math.random().toString(36).substring(2, 15)}.miff`;
  const text = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  const text2 = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  const buffer = await gm().in("(").in(image.path).coalesce().resize(500, 500).borderColor("black").border(5, 5).out(")").borderColor("white").border(3, 3).bufferPromise("miff");
  const size = await gm(buffer).sizePromise();
  await gm(buffer).coalesce().background("black").gravity("Center").extent(600, size.height + 50).writePromise(file);
  const size2 = await gm(file).sizePromise();
  await gm().background("black").out("-size", "600").fill("white").font("Times").pointSize(56).gravity("Center").out(`pango:${topText}`).gravity("South").out("-splice", bottomText ? "0x0" : "0x20").writePromise(text);
  const size3 = await gm(text).sizePromise();
  const command2 = gm(file).gravity("North").coalesce().background("black").extent(600, size2.height + size3.height).out("null:", "(", text, "-set", "page", `+0+${size2.height}`, ")", "-layers", "composite", "-layers", "optimize");
  let resultBuffer;
  if (bottomText) {
    await gm().background("black").out("-size", "600").fill("white").font("Times").pointSize(28).gravity("Center").out(`pango:${bottomText}`).gravity("South").out("-splice", "0x20").writePromise(text2);
    const size4 = await gm(text2).sizePromise();
    resultBuffer = await gm(await command2.bufferPromise(image.type)).gravity("North").coalesce().background("black").extent(600, size2.height + size3.height + size4.height).out("null:", "(", text2, "-set", "page", `+0+${size2.height + size3.height}`, ")", "-layers", "composite", "-layers", "optimize").bufferPromise(image.type);
  } else {
    resultBuffer = await command2.bufferPromise(image.type);
  }
  processMessage.delete();
  return message.channel.createMessage("", {
    file: resultBuffer,
    name: `motivate.${image.type}`
  });
};

exports.aliases = ["motivational", "motiv", "demotiv", "demotivational", "poster"];
exports.category = 5;
exports.help = "Creates a motivational poster";