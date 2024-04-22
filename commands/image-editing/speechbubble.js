import { Constants } from "oceanic.js";
import ImageCommand from "../../classes/imageCommand.js";

class SpeechBubbleCommand extends ImageCommand {
  params() {
    const parsedScale = Number.parseFloat(this.options.scale);
    return {
      water: this.options.alpha ? "assets/images/speech.png" : "assets/images/speechbubble.png",
      gravity: this.options.bottom ? "south" : "north",
      resize: true,
      yscale: !Number.isNaN(parsedScale) ? parsedScale : 0.2,
      alpha: this.options.alpha ? true : false,
      flipX: this.options.flip ? true : false,
      flipY: this.options.bottom ? true : false
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "alpha",
      description: "Make the top of the speech bubble transparent",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN
    }, {
      name: "flip",
      description: "Flips the speech bubble",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN
    }, {
      name: "bottom",
      description: "Puts the speech bubble on the bottom of the image",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN
    }, {
      name: "scale",
      description: "A multiplier to resize the speech bubble (0.01 is smallest, 1.0 is largest, default is 0.2)",
      type: Constants.ApplicationCommandOptionTypes.NUMBER,
      min_value: 0.01,
      max_value: 1.0
    });
    return this;
  }

  static description = "Adds a speech bubble to an image";
  static aliases = ["speech"];

  static noImage = "You need to provide an image/GIF to add a speech bubble!";
  static command = "watermark";
}

export default SpeechBubbleCommand;
