import fs from "fs";
import emojiRegex from "emoji-regex";
import ImageCommand from "../../classes/imageCommand.js";

class FlagCommand extends ImageCommand {
  flagPath = "";

  async criteria() {
    const text = this.options.text ?? this.args[0];
    const matched = text.match(emojiRegex());
    if (!matched) return false;
    const flag = this.ccFromFlag(matched[0]);
    let path = `assets/images/region-flags/png/${flag.toUpperCase()}.png`;
    if (flag === "pirate_flag") path = "assets/images/pirateflag.png";
    if (flag === "rainbow-flag") path = "assets/images/rainbowflag.png";
    if (flag === "checkered_flag") path = "assets/images/checkeredflag.png";
    if (flag === "transgender_flag") path = "assets/images/transflag.png";
    if (text === "🏴󠁧󠁢󠁳󠁣󠁴󠁿") path = "assets/images/region-flags/png/GB-SCT.png";
    if (text === "🏴󠁧󠁢󠁷󠁬󠁳󠁿") path = "assets/images/region-flags/png/GB-WLS.png";
    if (text === "🏴󠁧󠁢󠁥󠁮󠁧󠁿") path = "assets/images/region-flags/png/GB-ENG.png";
    try {
      await fs.promises.access(path);
      this.flagPath = path;
      return true;
    } catch {
      return false;
    }
  }

  ccFromFlag(flag) {
    const codepoints = [...flag].map(c => c.codePointAt() - 127397);
    return String.fromCodePoint(...codepoints);
  }

  params() {
    return {
      overlay: this.flagPath
    };
  }

  static description = "Overlays a flag onto an image";
  static arguments = ["[flag]"];

  static requiresText = true;
  static noText = "You need to provide an emoji of a flag to overlay!";
  static noImage = "You need to provide an image/GIF to overlay a flag onto!";
  static command = "flag";
}

export default FlagCommand;
