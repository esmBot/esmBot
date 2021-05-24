const ImageCommand = require("../../classes/imageCommand.js");

class WallCommand extends ImageCommand {
  static description = "Creates a wall from an image";

  static noImage = "You need to provide an image to make a wall!";
  static command = "wall";
}

module.exports = WallCommand;