import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class SpeedCommand extends ImageCommand {
  paramsFunc() {
    const speed = this.getOptionInteger("multiplier", true) ?? Number.parseInt(this.args[0]);
    return {
      speed: Number.isNaN(speed) || speed < 1 ? 2 : speed,
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "multiplier",
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: "Set the speed multiplier (default: 2)",
      minValue: 1,
      maxValue: 1000,
      classic: true,
    });
    return this;
  }

  static description = "Makes an image sequence faster";
  static aliases = ["speedup", "fast", "gifspeed", "faster"];

  static requiresAnim = true;
  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to speed up!";
  static command = "speed";
}

export default SpeedCommand;
