const gm = require("gm").subClass({
  imageMagick: true
});
const words = ["me irl", "dank", "follow my second account @esmBot_", "2016", "meme", "wholesome", "reddit", "instagram", "twitter", "facebook", "fortnite", "minecraft", "relatable", "gold", "funny", "template", "hilarious", "memes", "deep fried", "2020", "leafy", "pewdiepie"];

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to add a caption!`;
  const newArgs = args.filter(item => !item.includes(image.url) );
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const text = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  const size = await gm(image.path).sizePromise();
  await gm().out("-size", `${size.width - ((size.width / 25) * 2)}x`).background("white").fill("black").font("Helvetica Neue").out("-pointsize", size.width / 17).out(`pango:${newArgs.length !== 0 ? newArgs.join(" ") : words.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * words.length + 1)).join(" ")}`).gravity("Center").extent(size.width, `%[fx:h+${size.width / 25}]`).writePromise(text);
  const size2 = await gm(text).sizePromise();
  const outputFinal = await gm(image.path).gravity("North").extent(size.width, size2.height + size.height).out("null:", "(", text, "-set", "page", `+0+${size.height}`, ")", "-layers", "composite", "-layers", "optimize").bufferPromise(image.type, image.delay);
  await processMessage.delete();
  return {
    file: outputFinal,
    name: `caption2.${image.type}`
  };
};

exports.aliases = ["tags2", "meirl", "memecaption", "medotmecaption"];
exports.category = 5;
exports.help = "Adds a me.me caption/tag list to an image/GIF";