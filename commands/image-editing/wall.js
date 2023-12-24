import ImageCommand from "#cmd-classes/imageCommand.js";

class WallCommand extends ImageCommand {
  static description = "Creates a wall from an image";

  static noImage = "You need to provide an image/GIF to make a wall!";
  static command = "wall";
}

export default WallCommand;
