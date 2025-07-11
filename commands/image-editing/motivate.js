import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class MotivateCommand extends ImageCommand {
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
      topText: this.clean(topText),
      bottomText: bottomText ? this.clean(bottomText) : "",
      // @ts-expect-error this.constructor allows us to get static properties, but TS interprets it as a pure function
      font: font && this.constructor.allowedFonts.includes(font.toLowerCase()) ? font.toLowerCase() : "times",
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    this.flags.push({
      name: "font",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      choices: (() => {
        const array = [];
        for (const font of this.allowedFonts) {
          array.push({ name: font, value: font });
        }
        return array;
      })(),
      description: "Specify the font you want to use (default: times)",
    });
    return this;
  }

  static description = "Generates a motivational poster";
  static aliases = ["motivational", "motiv", "demotiv", "demotivational", "poster", "motivation", "demotivate"];

  static requiresParam = true;
  static noParam = "You need to provide some text to generate a motivational poster!";
  static noImage = "You need to provide an image/GIF to generate a motivational poster!";
  static command = "motivate";
}

export default MotivateCommand;
