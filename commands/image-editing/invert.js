import MediaCommand from "#cmd-classes/mediaCommand.js";

class InvertCommand extends MediaCommand {
  static description = "Inverts an image";
  static aliases = ["inverse", "negate", "negative"];

  static noImage = "You need to provide an image/GIF to invert!";
  static command = "invert";
}

export default InvertCommand;
