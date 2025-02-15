import ImageCommand from "#cmd-classes/imageCommand.js";

class InvertCommand extends ImageCommand {
  static description = "Inverts an image";
  static aliases = ["inverse", "negate", "negative"];

  static noImage = "You need to provide an image/GIF to invert!";
  static command = "invert";
}

export default InvertCommand;
