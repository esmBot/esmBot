import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class SlowCommand extends ImageCommand {
  paramsFunc() {
    const speed = this.getOptionInteger("multiplier", true) ?? Number.parseInt(this.args[0]);
    return {
      slow: true,
      speed: Number.isNaN(speed) ? 2 : speed,
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "multiplier",
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: "Set the speed multiplier (default: 2)",
      minValue: 1,
      classic: true,
    });
    return this;
  }

  static description = "Makes an image sequence slower";
  static aliases = ["slowdown", "slower", "gifspeed2"];

  static requiresAnim = true;
  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to slow down!";
  static command = "speed";
}

export default SlowCommand;
