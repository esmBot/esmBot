import { readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import MediaCommand from "#cmd-classes/mediaCommand.js";
import { random } from "#utils/misc.js";

const names = readdirSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../assets/images/uncanny/"))
  .filter((val) => {
    if (!val.startsWith(".") && val.endsWith(".png")) return true;
  })
  .map((val) => {
    return val.split(".")[0];
  });

class UncannyCommand extends MediaCommand {
  /**
   * @param {string} text
   */
  async criteria(text) {
    if (typeof text !== "string") return false;
    const [text1, text2] = text.split(/(?<!\\),/).map((elem) => elem.trim());
    if (text1 === "" && (!text2 || text2 === "")) return false;
    return true;
  }

  paramsFunc() {
    const newArgs = this.getOptionString("text") ?? this.args.join(" ");
    const [text1, text2] = newArgs.split(/(?<!\\),/).map((elem) => elem.trim());
    const font = this.getOptionString("font");
    const phase = this.getOptionString("phase");
    return {
      caption: this.clean(text1),
      caption2: this.clean(text2),
      path: `assets/images/uncanny/${phase && names.includes(phase.toLowerCase()) ? phase.toLowerCase() : random(names.filter((val) => val !== "goated"))}.png`,
      // @ts-expect-error this.constructor allows us to get static properties, but TS interprets it as a pure function
      font: font && this.constructor.allowedFonts.includes(font.toLowerCase()) ? font.toLowerCase() : "helvetica",
    };
  }

  static init() {
    super.init();
    this.addTextParam();
    this.flags.push(
      {
        name: "font",
        type: "string",
        choices: (() => {
          const array = [];
          for (const font of this.allowedFonts) {
            array.push({ name: font, value: font });
          }
          return array;
        })(),
        description: "Specify the font you want to use (default: helvetica)",
      },
      {
        name: "phase",
        type: "string",
        choices: (() => {
          const array = [];
          for (const name of names) {
            array.push({ name, value: name });
          }
          return array;
        })(),
        description: "Specify the uncanny image you want to use",
      },
    );
    return this;
  }

  static description = "Makes a Mr. Incredible Becomes Uncanny image (separate left/right text with a comma)";
  static aliases = ["canny", "incredible", "pain"];

  static noImage = "You need to provide an image/GIF to create an uncanny image!";
  static command = "uncanny";
}

export default UncannyCommand;
