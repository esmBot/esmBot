import ImageCommand from "../../classes/imageCommand.js";

class SpinCommand extends ImageCommand {
  static description = "Spins an image";
  static aliases = ["rotate"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to spin!";
  static command = "spin";
}

export default SpinCommand;
