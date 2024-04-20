import fs from "node:fs";
import emojiRegex from "emoji-regex";
import ImageCommand from "../../classes/imageCommand.js";

class FlagCommand extends ImageCommand {
  flagPath = "";

  async criteria() {
    const text = this.options.text ?? this.args[0];
    const matched = text.match(emojiRegex());
    if (!matched) return false;
    let path;
    if (matched[0] === "🏴󠁧󠁢󠁳󠁣󠁴󠁿") path = "assets/images/region-flags/png/GB-SCT.png";
    if (matched[0] === "🏴󠁧󠁢󠁷󠁬󠁳󠁿") path = "assets/images/region-flags/png/GB-WLS.png";
    if (matched[0] === "🏴󠁧󠁢󠁥󠁮󠁧󠁿") path = "assets/images/region-flags/png/GB-ENG.png";
    if (matched[0] === "🏴‍☠️") path = "assets/images/pirateflag.png";
    if (matched[0] === "🏳️‍🌈") path = "assets/images/rainbowflag.png";
    if (matched[0] === "🏁") path = "assets/images/checkeredflag.png";
    if (matched[0] === "🏳️‍⚧️") path = "assets/images/transflag.png";
    if (!path) {
      const flag = this.ccFromFlag(matched[0]);
      path = `assets/images/region-flags/png/${flag.toUpperCase()}.png`;
    }
    try {
      await fs.promises.access(path);
      this.flagPath = path;
      return true;
    } catch {
      return false;
    }
  }

  /**
   * @param {string} flag
   */
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

  static requiresText = true;
  static noText = "You need to provide an emoji of a flag to overlay!";
  static noImage = "You need to provide an image/GIF to overlay a flag onto!";
  static command = "flag";
}

export default FlagCommand;
