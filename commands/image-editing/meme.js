import ImageCommand from "../../classes/imageCommand.js";

class MemeCommand extends ImageCommand {
  params(url) {
    const newArgs = this.args.filter(item => !item.includes(url));
    const [topText, bottomText] = newArgs.join(" ").split(/(?<!\\),/).map(elem => elem.trim());
    return {
      top: topText.toUpperCase().replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%"),
      bottom: bottomText ? bottomText.toUpperCase().replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%") : ""
    };
  }

  static description = "Generates a meme from an image (separate top/bottom text with a comma)";
  static arguments = ["[top text]", "{bottom text}"];

  static requiresText = true;
  static noText = "You need to provide some text to generate a meme!";
  static noImage = "You need to provide an image to generate a meme!";
  static command = "meme";
}

export default MemeCommand;