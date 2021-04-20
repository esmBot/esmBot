const ImageCommand = require("../../classes/imageCommand");

class FlipCommand extends ImageCommand {
  static description = "Flips an image";

  static noImage = "you need to provide an image to flip!";
  static command = "flip";
}

module.exports = FlipCommand;