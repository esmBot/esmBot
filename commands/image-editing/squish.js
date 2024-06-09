import ImageCommand from "../../classes/imageCommand.js";

class SquishCommand extends ImageCommand {
  static description = "Squishes/stretches an image";
  static aliases = ["squishy", "squash"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to squish!";
  static command = "squish";
}

export default SquishCommand;
