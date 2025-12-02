import { Constants } from "oceanic.js";
import MediaCommand from "#cmd-classes/mediaCommand.js";

class FadeCommand extends MediaCommand {
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
