import ImageCommand from "../../classes/imageCommand.js";
import { random, cleanMessage } from "../../utils/misc.js";
import { readdirSync } from "node:fs";
import { Constants } from "oceanic.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
const prompts = ["you found:", "your dad is:", "you ate:", "your mom is:", "your sister is:", "you saw:", "you get lost in:", "you find:", "you grab:", "you pull out of your pocket:", "you fight:", "it's in your room:"];
const names = readdirSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../assets/images/uncanny/")).filter((val) => {
  if (!val.startsWith(".") && val.endsWith(".png")) return true;
}).map((val) => {
  return val.split(".")[0];
});

class UncannyCommand extends ImageCommand {
  params(url, name = "unknown") {
    const newArgs = this.options.text ?? this.args.join(" ");
    // eslint-disable-next-line prefer-const
    let [text1, text2] = newArgs.replaceAll(url, "").split(/(?<!\\),/).map(elem => elem.trim());
    if (!text2?.trim()) text2 = name;
    return {
      caption: text1?.trim() ? cleanMessage(this.message ?? this.interaction, text1) : random(prompts),
      caption2: cleanMessage(this.message ?? this.interaction, text2),
      path: `assets/images/uncanny/${typeof this.options.phase === "string" && names.includes(this.options.phase.toLowerCase()) ? this.options.phase.toLowerCase() : random(names.filter((val) => val !== "goated"))}.png`,
      font: typeof this.options.font === "string" && this.constructor.allowedFonts.includes(this.options.font.toLowerCase()) ? this.options.font.toLowerCase() : "helvetica"
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "font",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      choices: (() => {
        const array = [];
        for (const font of this.allowedFonts) {
          array.push({ name: font, value: font });
        }
        return array;
      })(),
      description: "Specify the font you want to use (default: helvetica)"
    }, {
      name: "phase",
      type: Constants.ApplicationCommandOptionTypes.STRING,
      choices: (() => {
        const array = [];
        for (const name of names) {
          array.push({ name, value: name });
        }
        return array;
      })(),
      description: "Specify the uncanny image you want to use"
    });
    return this;
  }

  static textOptional = true;

  static description = "Makes a Mr. Incredible Becomes Uncanny image (separate left/right text with a comma)";
  static aliases = ["canny", "incredible", "pain"];

  static noImage = "You need to provide an image/GIF to create an uncanny image!";
  static command = "uncanny";
}

export default UncannyCommand;
