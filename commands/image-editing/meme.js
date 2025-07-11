import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class MemeCommand extends ImageCommand {
  /**
   * @param {string | number | boolean | import("oceanic.js").User | import("oceanic.js").Attachment} text
   * @param {string | undefined} url
   */
  async criteria(text, url) {
    if (typeof text !== "string") return false;
    const [topText, bottomText] = text
      .replaceAll(url ?? "", "")
      .split(/(?<!\\),/)
      .map((elem) => elem.trim());
    if (topText === "" && (!bottomText || bottomText === "")) return false;
    return true;
  }

  /**
   * @param {string | undefined} url
   */
  paramsFunc(url) {
    const newArgs = this.getOptionString("text") ?? this.args.join(" ");
    const [topText, bottomText] = newArgs
      .replaceAll(url ?? "", "")
      .split(/(?<!\\),/)
      .map((elem) => elem.trim());
    const font = this.getOptionString("font");
    return {
      topText: this.clean(this.getOptionBoolean("case") ? topText : topText.toUpperCase()),
      bottomText: bottomText ? this.clean(this.getOptionBoolean("case") ? bottomText : bottomText.toUpperCase()) : "",
      // @ts-expect-error this.constructor allows us to get static properties, but TS interprets it as a pure function
      font: font && this.constructor.allowedFonts.includes(font.toLowerCase()) ? font.toLowerCase() : "impact",
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    this.flags.push(
      {
        name: "case",
        description: "Make the meme text case-sensitive (allows for lowercase text)",
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      },
      {
        name: "font",
        type: Constants.ApplicationCommandOptionTypes.STRING,
        choices: (() => {
          const array = [];
          for (const font of this.allowedFonts) {
            array.push({ name: font, value: font });
          }
          return array;
        })(),
        description: "Specify the font you want to use (default: impact)",
      },
    );
    return this;
  }

  static description = "Generates a meme from an image (separate top/bottom text with a comma)";

  static requiresParam = true;
  static noParam = "You need to provide some text to generate a meme!";
  static noImage = "You need to provide an image/GIF to generate a meme!";
  static command = "meme";
}

export default MemeCommand;
