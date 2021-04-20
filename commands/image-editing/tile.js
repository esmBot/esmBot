const ImageCommand = require("../../classes/imageCommand");

class TileCommand extends ImageCommand {
  static description = "Creates a tile pattern from an image";
  static aliases = ["wall2"];

  static noImage = "you need to provide an image to tile!";
  static command = "tile";
}

module.exports = TileCommand;