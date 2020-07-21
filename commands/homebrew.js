const magick = require("../build/Release/image.node");
const { promisify } = require("util");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to make a Homebrew Channel edit!`;
  message.channel.sendTyping();
  //const buffer = await gm(template).gravity("Center").font("./assets/hbc.ttf").out("-kerning", "-5").fill("white").pointSize(96).drawText(0, 0, cleanedMessage).bufferPromise("png");
  const buffer = await promisify(magick.homebrew)(args.join(" ").toLowerCase().replace(/\n/g, " "));
  return {
    file: buffer,
    name: "homebrew.png"
  };
};

exports.aliases = ["hbc", "brew", "wiibrew"];
exports.category = 4;
exports.help = "Creates a Homebrew Channel edit";
exports.params = "[text]";