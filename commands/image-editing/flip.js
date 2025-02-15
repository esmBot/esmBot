import ImageCommand from "#cmd-classes/imageCommand.js";

class FlipCommand extends ImageCommand {
  static description = "Flips an image";

  static noImage = "You need to provide an image/GIF to flip!";
  static command = "flip";
}

export default FlipCommand;
