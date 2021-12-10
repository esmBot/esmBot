import ImageCommand from "../../classes/imageCommand.js";
const words = ["me irl", "dank", "follow my second account @esmBot_", "2016", "meme", "wholesome", "reddit", "instagram", "twitter", "facebook", "fortnite", "minecraft", "relatable", "gold", "funny", "template", "hilarious", "memes", "deep fried", "2020", "leafy", "pewdiepie"];
const allowedFonts = ["futura", "impact", "helvetica", "arial", "roboto", "noto", "times"];

class CaptionTwoCommand extends ImageCommand {
  params(url) {
    const newArgs = this.args.filter(item => !item.includes(url));
    return {
      caption: newArgs.length !== 0 ? newArgs.join(" ").replaceAll("&", "\\&amp;").replaceAll(">", "\\&gt;").replaceAll("<", "\\&lt;").replaceAll("\"", "\\&quot;").replaceAll("'", "\\&apos;").replaceAll("%", "\\%") : words.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * words.length + 1)).join(" "),
      top: !!this.specialArgs.top,
      font: this.specialArgs.font && allowedFonts.includes(this.specialArgs.font.toLowerCase()) ? this.specialArgs.font.toLowerCase() : "helvetica"
    };
  }

  static description = "Adds a me.me caption/tag list to an image";
  static aliases = ["tags2", "meirl", "memecaption", "medotmecaption"];
  static arguments = ["{text}"];
  static flags = [{
    name: "top",
    description: "Put the caption on the top of an image instead of the bottom"
  }, {
    name: "font",
    type: allowedFonts.join("|"),
    description: "Specify the font you want to use (default: `helvetica`)"
  }];

  static noText = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image to add a caption!";
  static command = "captionTwo";
}

export default CaptionTwoCommand;
