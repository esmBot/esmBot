import { Constants } from "oceanic.js";
import MediaCommand from "#cmd-classes/mediaCommand.js";

class GlobeCommand extends MediaCommand {
  paramsFunc() {
    const snow = this.getOptionBoolean("snow");
    return {
      snow: !!snow,
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "snow",
      description: "Turns the globe into a snow globe",
      type: Constants.ApplicationCommandOptionTypes.BOOLEAN,
    });
    return this;
  }

  static description = "Spins an image";
  static aliases = ["sphere"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to spin!";
  static command = "globe";
}

export default GlobeCommand;
