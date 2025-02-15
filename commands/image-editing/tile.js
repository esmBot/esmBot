import ImageCommand from "#cmd-classes/imageCommand.js";

class TileCommand extends ImageCommand {
  static description = "Creates a tile pattern from an image";
  static aliases = ["wall2"];

  static noImage = "You need to provide an image/GIF to tile!";
  static command = "tile";
}

export default TileCommand;
