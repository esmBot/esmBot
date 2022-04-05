import ImageCommand from "../../classes/imageCommand.js";
const allowedFonts = ["futura", "impact", "helvetica", "arial", "roboto", "noto", "times"];

class MotivateCommand extends ImageCommand {
  params(url) {
    const newArgs = this.type === "classic" ? this.args.filter(item => !item.includes(url)).join(" ") : this.options.text;
    const [topText, bottomText] = newArgs.split(/(?<!\\),/).map(elem => elem.trim());
    return {
      top: topText.replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%"),
      bottom: bottomText ? bottomText.replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%") : "",
      font: this.specialArgs.font && allowedFonts.includes(this.specialArgs.font.toLowerCase()) ? this.specialArgs.font.toLowerCase() : "times"
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "font",
      type: 3,
      choices: (() => {
        const array = [];
        for (const font of allowedFonts) {
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
  static arguments = ["[top text]", "{bottom text}"];

  static requiresText = true;
  static noText = "You need to provide some text to generate a motivational poster!";
  static noImage = "You need to provide an image/GIF to generate a motivational poster!";
  static command = "motivate";
}

export default MotivateCommand;
