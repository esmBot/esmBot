import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class JPEGCommand extends ImageCommand {
  paramsFunc() {
    const quality = this.getOptionInteger("quality", true) ?? Number.parseInt(this.args[0]);
    return {
      quality: Number.isNaN(quality) ? 1 : Math.max(1, Math.min(quality, 100)),
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "quality",
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: "Set the JPEG quality (default: 1)",
      minValue: 1,
      maxValue: 100,
      classic: true,
    });
    return this;
  }

  static description = "Adds JPEG compression to an image";
  static aliases = ["needsmorejpeg", "jpegify", "magik2", "morejpeg", "jpg", "quality"];

  static noImage = "You need to provide an image/GIF to add more JPEG!";
  static command = "jpeg";
}

export default JPEGCommand;
