import MediaCommand from "#cmd-classes/mediaCommand.js";

class ReverseCommand extends MediaCommand {
  static description = "Reverses an image sequence";
  static aliases = ["backwards"];

  static requiresAnim = true;
  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to reverse!";
  static command = "reverse";
}

export default ReverseCommand;
