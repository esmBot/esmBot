import { Constants } from "oceanic.js";
import MediaCommand from "#cmd-classes/mediaCommand.js";

class SlideCommand extends MediaCommand {
  paramsFunc() {
    const vertical = this.getOptionBoolean("vertical");
    const reverse = this.getOptionBoolean("reverse");
    return {
      vertical: !!vertical,
      reverse: !!reverse,
    };
  }

  static init() {
    super.init();
    this.flags.push(
      {
        name: "vertical",
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
        description: "Slides the image vertically",
        classic: true,
      },
      {
        name: "reverse",
        type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
        description: "Changes the direction the image slides in",
        classic: true,
      },
    );
    return this;
  }

  static description = "Slides an image in a direction";
  static aliases = ["shift"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to slide!";
  static command = "slide";
}

export default SlideCommand;
