import wrap from "../../utils/wrap.js";
import ImageCommand from "../../classes/imageCommand.js";

class RetroCommand extends ImageCommand {
  params() {
    let [line1, line2, line3] = this.args.join(" ").replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%").split(",").map(elem => elem.trim());
    if (!line2 && line1.length > 15) {
      const [split1, split2, split3] = wrap(line1, { width: 15, indent: "" }).split("\n");
      line1 = split1;
      line2 = split2 ?? "";
      line3 = split3 ?? "";
    } else {
      if (!line2) {
        line2 = "";
      }
      if (!line3) {
        line3 = "";
      }
    }
    return { line1, line2, line3 };
  }

  static description = "Generates a retro text image (separate lines with a comma)";
  static arguments = ["[top text]", "{middle text}", "{bottom text}"];

  static requiresImage = false;
  static requiresText = true;
  static noText = "You need to provide some text to make retro!";
  static command = "retro";
}

export default RetroCommand;
