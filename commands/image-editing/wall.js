const ImageCommand = require("../../classes/imageCommand.js");

class WallCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Creates a wall from an image";

  static noImage = "you need to provide an image to make a wall!";
  static command = "wall";
}

module.exports = WallCommand;