const gm = require("gm").subClass({
  imageMagick: true
});
const gmToBuffer = require("../utils/gmbuffer.js");
const wrap = require("../utils/wrap.js");

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to make a Sonic meme!`;
  message.channel.sendTyping();
  const template = "./assets/images/sonic.jpg";
  const file = `/tmp/${Math.random().toString(36).substring(2, 15)}.png`;
  const cleanedMessage = args.join(" ").replace(/&/g, "\\&amp;").replace(/>/g, "\\&gt;").replace(/</g, "\\&lt;");
  gm(474, 332).out("+size").gravity("Center").out("-pointsize", 40).out("-font", "Bitstream Vera Sans").out(`pango:${wrap(cleanedMessage, {width: 15, indent: ""})}`).negative().out("-fuzz", "30%").transparent("black").write(file, async (error) => {
    if (error) console.error;
    const command = gm(template).composite(file).gravity("Center").geometry("474x332+160+10");
    const resultBuffer = await gmToBuffer(command, "png");
    return message.channel.createMessage("", {
      file: resultBuffer,
      name: "sonic.png"
    });
  });
};

exports.category = 4;
exports.help = "Creates a Sonic speech bubble image";