import ImageCommand from "../../classes/imageCommand.js";

class ReverseCommand extends ImageCommand {
  static description = "Reverses an image sequence";
  static aliases = ["backwards"];

  static requiresGIF = true;
  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to reverse!";
  static command = "reverse";
}

export default ReverseCommand;
