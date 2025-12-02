import MediaCommand from "#cmd-classes/mediaCommand.js";

class TileCommand extends MediaCommand {
  static description = "Creates a tile pattern from an image";
  static aliases = ["wall2"];

  static noImage = "You need to provide an image/GIF to tile!";
  static command = "tile";
}

export default TileCommand;
