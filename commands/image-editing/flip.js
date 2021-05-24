const ImageCommand = require("../../classes/imageCommand.js");

class FlipCommand extends ImageCommand {
  static description = "Flips an image";

  static noImage = "You need to provide an image to flip!";
  static command = "flip";
}

module.exports = FlipCommand;