import fs from "node:fs";
import ImageCommand from "#cmd-classes/imageCommand.js";

class FlagCommand extends ImageCommand {
  flagPath = "";

  async criteria() {
    const text = this.getOptionString("text") ?? this.args[0];
    const matched = text.match(/\p{RGI_Emoji_Flag_Sequence}|\p{RGI_Emoji_Tag_Sequence}|🏴‍☠️|🏳️‍🌈|🏁|🏳️‍⚧️/gv);
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
      path = `assets/images/region-flags/png/${flag?.toUpperCase()}.png`;
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
    const codepoints = [...flag].map((c) => {
      const codepoint = c.codePointAt(0);
      if (!codepoint) throw Error("Missing codepoint");
      return codepoint - 127397;
    });
    if (codepoints.find((v) => v < 65 || v > 90)) return;
    return String.fromCodePoint(...codepoints);
  }

  paramsFunc() {
    return {
      overlay: this.flagPath,
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    return this;
  }

  static description = "Overlays a flag onto an image";

  static requiresParam = true;
  static noParam = "You need to provide an emoji of a flag to overlay!";
  static noImage = "You need to provide an image/GIF to overlay a flag onto!";
  static command = "flag";
}

export default FlagCommand;
