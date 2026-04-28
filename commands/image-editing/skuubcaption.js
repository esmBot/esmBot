import MediaCommand from "#cmd-classes/mediaCommand.js";
import { generateSkuubCaptionIdea } from "#utils/captionIdeas.js";

class SkuubCaptionCommand extends MediaCommand {
  async run() {
    this.generatedCaption = await generateSkuubCaptionIdea();
    return super.run();
  }

  paramsFunc() {
    const font = this.getOptionString("font");
    return {
      caption: this.clean(this.generatedCaption),
      font:
        font && this.constructor.allowedFonts.includes(font.toLowerCase())
          ? font.toLowerCase()
          : "futura",
      avatarUrl: this.author.avatarURL("png", 128),
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "font",
      type: "string",
      choices: (() => {
        const array = [];
        for (const font of this.allowedFonts) {
          array.push({ name: font, value: font });
        }
        return array;
      })(),
      description: "Specify the font you want to use (default: futura)",
    });
    return this;
  }

  static description = "Automatically captions an image/GIF with a skuub-style caption";
  static aliases = ["autocaption", "autoskuubcaption"];

  static noImage = "You need to provide an image/GIF to skuubcaption!";
  static command = "caption";
}

export default SkuubCaptionCommand;
