import ImageCommand from "../../classes/imageCommand.js";
import { random } from "../../utils/misc.js";
import { readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
const prompts = ["you found:", "your dad is:", "you ate:", "your mom is:", "your sister is:", "you saw:", "you get lost in:", "you find:", "you grab:", "you pull out of your pocket:", "you fight:", "it's in your room:"];
const names = readdirSync(resolve(dirname(fileURLToPath(import.meta.url)), "../../assets/images/uncanny/")).map((val) => {
  return val.split(".")[0];
});

class UncannyCommand extends ImageCommand {
  params(url, name = "unknown") {
    const newArgs = this.options.text ?? this.args.join(" ");
    // eslint-disable-next-line prefer-const
    let [text1, text2] = newArgs.replaceAll(url, "").split(/(?<!\\),/).map(elem => elem.trim());
    if (!text2?.trim()) text2 = name;
    return {
      caption: text1?.trim() ? text1.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;").replaceAll("\\n", "\n") : random(prompts),
      caption2: text2.replaceAll("&", "&amp;").replaceAll(">", "&gt;").replaceAll("<", "&lt;").replaceAll("\"", "&quot;").replaceAll("'", "&apos;").replaceAll("\\n", "\n"),
      path: `./assets/images/uncanny/${typeof this.options.phase === "string" && names.includes(this.options.phase.toLowerCase()) ? this.options.phase.toLowerCase() : random(names.filter((val) => val !== "goated"))}.png`,
      font: typeof this.options.font === "string" && this.constructor.allowedFonts.includes(this.options.font.toLowerCase()) ? this.options.font.toLowerCase() : "helvetica"
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
      description: "Specify the font you want to use (default: helvetica)"
    }, {
      name: "phase",
      type: 3,
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
  static arguments = ["{left text}", "{right text}"];

  static noImage = "You need to provide an image/GIF to create an uncanny image!";
  static command = "uncanny";
}

export default UncannyCommand;
