import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class MotivateCommand extends ImageCommand {
  async criteria(text, url) {
    const [topText, bottomText] = text.replaceAll(url, "").split(/(?<!\\),/).map(elem => elem.trim());
    if (topText === "" && bottomText === "") return false;
    return true;
  }

  params(url) {
    const newArgs = this.getOptionString("text") ?? this.args.join(" ");
    const [topText, bottomText] = newArgs.replaceAll(url, "").split(/(?<!\\),/).map(elem => elem.trim());
    const font = this.getOptionString("font");
    return {
      topText: this.clean(topText),
      bottomText: bottomText ? this.clean(bottomText) : "",
      font: font && this.constructor.allowedFonts.includes(font.toLowerCase()) ? font.toLowerCase() : "times"
    };
  }

  static init() {
    super.init();
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
      description: "Specify the font you want to use (default: times)"
    });
    return this;
  }

  static description = "Generates a motivational poster";
  static aliases = ["motivational", "motiv", "demotiv", "demotivational", "poster", "motivation", "demotivate"];

  static requiresText = true;
  static noText = "You need to provide some text to generate a motivational poster!";
  static noImage = "You need to provide an image/GIF to generate a motivational poster!";
  static command = "motivate";
}

export default MotivateCommand;
