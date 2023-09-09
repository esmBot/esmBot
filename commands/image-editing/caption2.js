import ImageCommand from "../../classes/imageCommand.js";
import { cleanMessage } from "../../utils/misc.js";
const words = ["me irl", "dank", "follow my second account @esmBot_", "2016", "meme", "wholesome", "reddit", "instagram", "twitter", "facebook", "fortnite", "minecraft", "relatable", "gold", "funny", "template", "hilarious", "memes", "deep fried", "2020", "leafy", "pewdiepie"];

class CaptionTwoCommand extends ImageCommand {
  params(url) {
    const newArgs = this.options.text ?? this.args.filter(item => !item.includes(url)).join(" ");
    return {
      caption: newArgs?.trim() ? cleanMessage(this.message ?? this.interaction, newArgs) : words.sort(() => 0.5 - Math.random()).slice(0, Math.floor(Math.random() * words.length + 1)).join(" "),
      top: !!this.options.top,
      font: typeof this.options.font === "string" && this.constructor.allowedFonts.includes(this.options.font.toLowerCase()) ? this.options.font.toLowerCase() : "helvetica"
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "top",
      description: "Put the caption on the top of an image instead of the bottom",
      type: 5
    }, {
      name: "font",
      type: 3,
      choices: (() => {
        const array = [];
        for (const font of this.allowedFonts) {
          array.push({ name: font, value: font });
        }
        return array;
      })(),
      description: "Specify the font you want to use (default: helvetica)"
    });
    return this;
  }

  static description = "Adds a me.me caption/tag list to an image";
  static aliases = ["tags2", "meirl", "memecaption", "medotmecaption"];
  static arguments = ["{text}"];

  static textOptional = true;
  static noText = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image/GIF to add a caption!";
  static command = "captionTwo";
}

export default CaptionTwoCommand;
