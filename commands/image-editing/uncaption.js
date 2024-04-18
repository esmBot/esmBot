import { Constants } from "oceanic.js";
import ImageCommand from "../../classes/imageCommand.js";

class UncaptionCommand extends ImageCommand {
  params() {
    const tolerance = Number.parseFloat(this.options.tolerance);
    return {
      tolerance: Number.isNaN(tolerance) ? 0.95 : tolerance
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "tolerance",
      type: Constants.ApplicationCommandOptionTypes.NUMBER,
      description: "Set the shade tolerance for the caption detection (0.0 is highest, 1.0 is lowest, default is 0.95)",
      min_value: 0,
      max_value: 1
    });
    return this;
  }

  static description = "Removes the caption from an image";

  static noImage = "You need to provide an image/GIF to uncaption!";
  static command = "uncaption";
}

export default UncaptionCommand;
