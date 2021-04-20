const ImageCommand = require("../../classes/imageCommand");

class FlopCommand extends ImageCommand {
  params = {
    flop: true
  };

  static description = "Flips an image";
  static aliases = ["flip2"];

  static noImage = "you need to provide an image to flop!";
  static command = "flip";
}

module.exports = FlopCommand;