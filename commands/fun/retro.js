const magick = require("../../utils/image.js");
const wrap = require("../../utils/wrap.js");
const Command = require("../../classes/command.js");

class RetroCommand extends Command {
  async run() {
    if (this.args.length === 0) return `${this.message.author.mention}, you need to provide some text to generate some retro text!`;
    this.client.sendChannelTyping(this.message.channel.id);
    let [line1, line2, line3] = this.args.join(" ").replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%").split(",").map(elem => elem.trim());
    if (!line2 && line1.length > 15) {
      const [split1, split2, split3] = wrap(line1, { width: 15, indent: "" }).split("\n");
      line1 = split1;
      line2 = split2 ? split2 : "";
      line3 = split3 ? split3 : "";
    } else {
      if (!line2) {
        line2 = "";
      }
      if (!line3) {
        line3 = "";
      }
    }
    const { buffer } = await magick.run({
      cmd: "retro",
      line1,
      line2,
      line3
    });
    return {
      file: buffer,
      name: "retro.png"
    };
  }

  static description = "Generates a retro text image (separate lines with a comma)";
  static arguments = ["[text]", "{middle text}", "{bottom text}"];
}

module.exports = RetroCommand;