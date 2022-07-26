import ImageCommand from "../../classes/imageCommand.js";

class MotivateCommand extends ImageCommand {
  params(url) {
    const newArgs = this.options.text ?? this.args.filter(item => !item.includes(url)).join(" ");
    const [topText, bottomText] = newArgs.split(/(?<!\\),/).map(elem => elem.trim());
    return {
      top: topText.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;").replaceAll("\\n", "\n"),
      bottom: bottomText ? bottomText.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;").replaceAll("\\n", "\n") : "",
      font: typeof this.options.font === "string" && this.constructor.allowedFonts.includes(this.options.font.toLowerCase()) ? this.options.font.toLowerCase() : "times"
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "font",
      type: 3,
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
  static arguments = ["[top text]", "{bottom text}"];

  static requiresText = true;
  static noText = "You need to provide some text to generate a motivational poster!";
  static noImage = "You need to provide an image/GIF to generate a motivational poster!";
  static command = "motivate";
}

export default MotivateCommand;
