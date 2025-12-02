import { Constants } from "oceanic.js";
import MediaCommand from "#cmd-classes/mediaCommand.js";
const words = [
  "me irl",
  "dank",
  "follow my second account @esmBot_",
  "2016",
  "meme",
  "wholesome",
  "reddit",
  "instagram",
  "twitter",
  "facebook",
  "fortnite",
  "minecraft",
  "relatable",
  "gold",
  "funny",
  "template",
  "hilarious",
  "memes",
  "deep fried",
  "2020",
  "leafy",
  "pewdiepie",
];

class CaptionTwoCommand extends MediaCommand {
  /**
   * @param {string | undefined} url
   */
  paramsFunc(url) {
    const newArgs = this.getOptionString("text") ?? this.args.filter((item) => !item.includes(url ?? "")).join(" ");
    const font = this.getOptionString("font");
    return {
      caption: newArgs?.trim()
        ? this.clean(newArgs)
        : words
            .sort(() => 0.5 - Math.random())
            .slice(0, Math.floor(Math.random() * words.length + 1))
            .join(" "),
      top: !!this.getOptionBoolean("top"),
      // @ts-expect-error this.constructor allows us to get static properties, but TS interprets it as a pure function
      font: font && this.constructor.allowedFonts.includes(font.toLowerCase()) ? font.toLowerCase() : "helvetica",
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    this.flags.push(
      {
        name: "top",
        description: "Put the caption on the top of an image instead of the bottom",
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
        description: "Specify the font you want to use (default: helvetica)",
      },
    );
    return this;
  }

  static description = "Adds a bottom caption/tag list to an image";
  static aliases = ["tags2", "meirl", "memecaption", "medotmecaption"];

  static textOptional = true;
  static noParam = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image/GIF to add a caption!";
  static command = "captionTwo";
}

export default CaptionTwoCommand;
