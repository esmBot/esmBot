const RetroText = require("retrotext");
const { TextStyle, BackgroundStyle } = RetroText;

exports.run = async (message, args) => {
  if (args.length === 0) return `${message.author.mention}, you need to provide some text to generate some retro text!`;
  message.channel.sendTyping();
  const [line1, line2, line3] = args.join(" ").split(",").map(elem => elem.trim());
  if (/^[\w ]+$/i.test(line1) === false || /^[\w ]+$/i.test(line2) === false || /^[\w ]+$/i.test(line3) === false) return `${message.author.mention}, only alphanumeric characters, spaces, and underscores are allowed!`;
  let text;
  if (line3) {
    text = new RetroText.default().setLine1(line1).setLine2(line2).setLine3(line3).setBackgroundStyle(BackgroundStyle.OUTLINE_TRIANGLE).setTextStyle(TextStyle.CHROME);
  } else if (line2) {
    text = new RetroText.default().setLine1(line1).setLine2(line2).setBackgroundStyle(BackgroundStyle.OUTLINE_TRIANGLE).setTextStyle(TextStyle.CHROME);
  } else {
    text = new RetroText.default().setLine2(line1).setBackgroundStyle(BackgroundStyle.OUTLINE_TRIANGLE).setTextStyle(TextStyle.CHROME);
  }
  const buffer = await text.fetchBuffer();
  return {
    file: Buffer.from(buffer),
    name: "retro.png"
  };
};

exports.category = 4;
exports.help = "Generates a retro text image (separate lines with a comma)";
exports.params = "[top text], {middle text}, {bottom text}";