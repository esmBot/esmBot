import { Constants } from "oceanic.js";
import MediaCommand from "#cmd-classes/mediaCommand.js";

class SpeedCommand extends MediaCommand {
  paramsFunc() {
    const speed = this.getOptionNumber("multiplier", true) ?? Number.parseFloat(this.args[0]);
    return {
      speed: Number.isNaN(speed) || speed < 1 ? 2 : speed,
    };
  }

  static init() {
    super.init();
    this.flags.push({
      name: "multiplier",
      type: Constants.ApplicationCommandOptionTypes.NUMBER,
      description: "Set the speed multiplier (default: 2.0)",
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
