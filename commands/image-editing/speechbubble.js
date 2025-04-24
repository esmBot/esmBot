import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class SpeechBubbleCommand extends ImageCommand {
  paramsFunc() {
    const parsedScale = this.getOptionNumber("scale");
    const alpha = this.getOptionBoolean("alpha");
    const bottom = this.getOptionBoolean("bottom");
    return {
      water: alpha ? "assets/images/speech.png" : "assets/images/speechbubble.png",
      gravity: bottom ? 8 : 2,
      resize: true,
      yscale: parsedScale != null && !Number.isNaN(parsedScale) ? parsedScale : 0.2,
      alpha: !!alpha,
      flipX: !!this.getOptionBoolean("flip"),
      flipY: !!bottom,
    };
  }

  static init() {
    super.init();
    this.flags.push(
      {
        name: "alpha",
        description: "Make the top of the speech bubble transparent",
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      },
      {
        name: "flip",
        description: "Flips the speech bubble",
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      },
      {
        name: "bottom",
        description: "Puts the speech bubble on the bottom of the image",
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
      },
      {
        name: "scale",
        description: "A multiplier to resize the speech bubble (0.01 is smallest, 1.0 is largest, default is 0.2)",
        type: Constants.ApplicationCommandOptionTypes.NUMBER,
        minValue: 0.01,
        maxValue: 1.0,
      },
    );
    return this;
  }

  static description = "Adds a speech bubble to an image";
  static aliases = ["speech"];

  static noImage = "You need to provide an image/GIF to add a speech bubble!";
  static command = "watermark";
}

export default SpeechBubbleCommand;
