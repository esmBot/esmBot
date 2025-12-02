import MediaCommand from "#cmd-classes/mediaCommand.js";

class SpinCommand extends MediaCommand {
  static description = "Spins an image";
  static aliases = ["rotate"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to spin!";
  static command = "spin";
}

export default SpinCommand;
