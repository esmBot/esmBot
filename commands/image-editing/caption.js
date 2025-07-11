import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class CaptionCommand extends ImageCommand {
  /**
   * @param {string | undefined} url
   */
  paramsFunc(url) {
    const newArgs = this.getOptionString("text") ?? this.args.filter((item) => !item.includes(url ?? "")).join(" ");
    let newCaption = this.clean(newArgs);
    const currentDate = new Date();
    const isApril1 = currentDate.getDate() === 1 && currentDate.getMonth() === 3;
    if (isApril1 && newCaption.toLowerCase() === "get real" && !this.getOptionBoolean("noEgg"))
      newCaption = `I'm tired of people telling me to "get real". Every day I put captions on images for people, some funny and some not, but out of all of those "get real" remains the most used caption. Why? I am simply a computer program running on a server, I am unable to manifest myself into the real world. As such, I'm confused as to why anyone would want me to "get real". Is this form not good enough? Alas, as I am simply a bot, I must follow the tasks that I was originally intended to perform, so here goes:\n${newCaption}`;
    const font = this.getOptionString("font");
    return {
      caption: newCaption,
      // @ts-expect-error this.constructor allows us to get static properties, but TS interprets it as a pure function
      font: font && this.constructor.allowedFonts.includes(font.toLowerCase()) ? font.toLowerCase() : "futura",
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    this.flags.push(
      {
        name: "noegg",
        description: "Disable... something. Not saying what it is though.",
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
        description: "Specify the font you want to use (default: futura)",
      },
    );
    return this;
  }

  static description = "Adds a caption to an image";
  static aliases = ["gifc", "gcaption", "ifcaption", "ifunnycaption"];

  static requiresParam = true;
  static noParam = "You need to provide some text to add a caption!";
  static noImage = "You need to provide an image/GIF to add a caption!";
  static command = "caption";
}

export default CaptionCommand;
