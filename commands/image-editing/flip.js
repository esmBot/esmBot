import MediaCommand from "#cmd-classes/mediaCommand.js";

class FlipCommand extends MediaCommand {
  static description = "Flips an image";

  static noImage = "You need to provide an image/GIF to flip!";
  static command = "flip";
}

export default FlipCommand;
