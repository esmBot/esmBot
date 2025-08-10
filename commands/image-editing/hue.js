import { Constants } from "oceanic.js";
import ImageCommand from "#cmd-classes/imageCommand.js";

class HueCommand extends ImageCommand {
  paramsFunc() {
    const shift = this.getOptionInteger("shift", true) ?? Number.parseInt(this.args[0]);
    return {
      color: "hueshift",
      shift: Math.max(-180, Math.min(shift, 180)),
    };
  }

  static init() {
    super.init();
    // required params need to be at the beginning of the array,
    // so we use unshift instead of push here
    this.flags.unshift({
      name: "shift",
      type: Constants.ApplicationCommandOptionTypes.INTEGER,
      description: "Set the amount to shift by",
      minValue: -180,
      maxValue: 180,
      classic: true,
      required: true,
    });
    return this;
  }

  static description = "Hue shifts an image";

  static requiresParam = true;
  static requiredParam = "shift";
  static requiredParamType = Constants.ApplicationCommandOptionTypes.INTEGER;
  static noParam = "You need to provide the amount you want to hue shift by!";

  static noImage = "You need to provide an image/GIF to hue shift!";
  static command = "colors";
  static aliases = ["hueshift", "recolor"];
}

export default HueCommand;
