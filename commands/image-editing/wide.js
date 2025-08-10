import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class WideCommand extends ImageCommand {
  paramsFunc() {
    const amount = this.getOptionInteger("scale");
    return {
      wide: true,
      amount: amount != null && !Number.isNaN(amount) ? amount : 19,
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "scale",
      description: "The amount to widen the image by (1 is smallest, 19 is largest, default is 19)",
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      minValue: 1,
      maxValue: 19,
    });
    return this;
  }

  static description = "Stretches an image to 19x its width";
  static aliases = ["w19", "wide19"];

  static noImage = "You need to provide an image/GIF to stretch!";
  static command = "resize";
}

export default WideCommand;
