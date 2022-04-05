import ImageCommand from "../../classes/imageCommand.js";
const allowedFonts = ["futura", "impact", "helvetica", "arial", "roboto", "noto", "times"];

class MemeCommand extends ImageCommand {
  params(url) {
    const newArgs = this.type === "classic" ? this.args.filter(item => !item.includes(url)).join(" ") : this.options.text;
    const [topText, bottomText] = newArgs.split(/(?<!\\),/).map(elem => elem.trim());
    return {
      top: (this.specialArgs.case ? topText : topText.toUpperCase()).replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%"),
      bottom: bottomText ? (this.specialArgs.case ? bottomText : bottomText.toUpperCase()).replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%") : "",
      font: this.specialArgs.font && allowedFonts.includes(this.specialArgs.font.toLowerCase()) ? this.specialArgs.font.toLowerCase() : "impact"
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "case",
      description: "Make the meme text case-sensitive (allows for lowercase text)",
      type: 5
    }, {
      name: "font",
      type: 3,
      choices: (() => {
        const array = [];
        for (const font of allowedFonts) {
          array.push({ name: font, value: font });
        }
        return array;
      })(),
      description: "Specify the font you want to use (default: impact)"
    });
    return this;
  }

  static description = "Generates a meme from an image (separate top/bottom text with a comma)";
  static arguments = ["[top text]", "{bottom text}"];

  static requiresText = true;
  static noText = "You need to provide some text to generate a meme!";
  static noImage = "You need to provide an image/GIF to generate a meme!";
  static command = "meme";
}

export default MemeCommand;
