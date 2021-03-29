const RetroText = require("retrotext");
const { TextStyle, BackgroundStyle } = RetroText;
const Command = require("../../classes/command.js");

class RetroCommand extends Command {
  constructor(message, args, content) {
    super(message, args, content);
  }

  async run() {
    if (this.args.length === 0) return `${this.message.author.mention}, you need to provide some text to generate some retro text!`;
    this.message.channel.sendTyping();
    const [line1, line2, line3] = this.args.join(" ").split(",").map(elem => elem.trim());
    if (/^[\w ]+$/i.test(line1) === false || /^[\w ]+$/i.test(line2) === false || /^[\w ]+$/i.test(line3) === false) return `${this.message.author.mention}, only alphanumeric characters, spaces, and underscores are allowed!`;
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
  }

  static description = "Generates a retro text image (separate lines with a comma)";
  static arguments = ["[text]", "{middle text}", "{bottom text}"];
}

module.exports = RetroCommand;