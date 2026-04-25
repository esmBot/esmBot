import MediaCommand from "#cmd-classes/mediaCommand.js";

class RotateCommand extends MediaCommand {
  paramsFunc() {
    const angle = this.getOptionNumber("angle", true);
    return {
      angle: angle == null || Number.isNaN(angle) ? 90.0 : angle,
    };
  }

  static init() {
    super.init();
    // required params need to be at the beginning of the array,
    // so we use unshift instead of push here
    this.flags.unshift({
      name: "angle",
      type: "number",
      description: "Set the rotation angle",
      required: true,
      minValue: 1,
      maxValue: 360,
    });
    return this;
  }

  static description = "Rotates an image";

  static noImage = "You need to provide an image/GIF to rotate!";
  static command = "spin";
}

export default RotateCommand;
