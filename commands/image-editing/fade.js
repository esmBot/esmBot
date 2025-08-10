import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class FadeCommand extends ImageCommand {
  paramsFunc() {
    const alpha = this.getOptionBoolean("alpha");
    return {
      alpha: !!alpha,
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "alpha",
      description: "Fade in from transparency",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
    });
    return this;
  }

  static description = "Fades in an image";
  static aliases = ["fadein"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to fade in!";
  static command = "fade";
}

export default FadeCommand;
