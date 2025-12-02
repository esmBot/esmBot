import MediaCommand from "#cmd-classes/mediaCommand.js";

class WallCommand extends MediaCommand {
  static description = "Creates a wall from an image";

  static noImage = "You need to provide an image/GIF to make a wall!";
  static command = "wall";
}

export default WallCommand;
