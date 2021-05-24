const ImageCommand = require("../../classes/imageCommand.js");

class SpinCommand extends ImageCommand {
  static description = "Spins an image";
  static aliases = ["rotate"];

  static noImage = "You need to provide an image to spin!";
  static command = "spin";
}

module.exports = SpinCommand;