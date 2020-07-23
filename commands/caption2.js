const magick = require("../build/Release/image.node");
const { promisify } = require("util");
const words = ["me irl", "dank", "follow my second account @esmBot_", "2016", "meme", "wholesome", "reddit", "instagram", "twitter", "facebook", "fortnite", "minecraft", "relatable", "gold", "funny", "template", "hilarious", "memes", "deep fried", "2020", "leafy", "pewdiepie"];

exports.run = async (message, args) => {
  const image = await require("../utils/imagedetect.js")(message);
  if (image === undefined) return `${message.author.mention}, you need to provide an image/GIF to add a caption!`;
  const newArgs = args.filter(item => !item.includes(image.url) );
  const processMessage = await message.channel.createMessage("<a:processing:479351417102925854> Processing... This might take a while");
  const outputFinal = await promisify(magick.captionTwo)(newArgs.length !== 0 ? newArgs.join(" ") : words.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * words.length + 1)).join(" "), image.path, image.type.toUpperCase(), image.delay ? (100 / image.delay.split("/")[0]) * image.delay.split("/")[1] : 0);
  await processMessage.delete();
  return {
    file: outputFinal,
    name: `caption2.${image.type}`
  };
};

exports.aliases = ["tags2", "meirl", "memecaption", "medotmecaption"];
exports.category = 5;
exports.help = "Adds a me.me caption/tag list to an image/GIF";
