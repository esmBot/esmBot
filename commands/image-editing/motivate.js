import ImageCommand from "../../classes/imageCommand.js";

class MotivateCommand extends ImageCommand {
  params(url) {
    const newArgs = this.args.filter(item => !item.includes(url));
    const [topText, bottomText] = newArgs.join(" ").split(/(?<!\\),/).map(elem => elem.trim());
    return {
      top: topText.replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%"),
      bottom: bottomText ? bottomText.replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%") : ""
    };
  }

  static description = "Generates a motivational poster";
  static aliases = ["motivational", "motiv", "demotiv", "demotivational", "poster", "motivation", "demotivate"];
  static arguments = ["[top text]", "{bottom text}"];

  static requiresText = true;
  static noText = "You need to provide some text to generate a motivational poster!";
  static noImage = "You need to provide an image to generate a motivational poster!";
  static command = "motivate";
}

export default MotivateCommand;