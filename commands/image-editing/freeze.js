import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class FreezeCommand extends ImageCommand {
  paramsFunc() {
    const frameCount = this.getOptionInteger("endframe", true) ?? Number.parseInt(this.args[0]);
    return {
      loop: false,
      frame: Number.isNaN(frameCount) ? -1 : frameCount,
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "endframe",
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: "Set the end frame (default: last frame)",
      minValue: 0,
      classic: true,
    });
    return this;
  }

  static description = "Makes an image sequence only play once";
  static aliases = ["noloop", "once"];

  static requiresAnim = true;
  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to freeze!";
  static command = "freeze";
}

export default FreezeCommand;
