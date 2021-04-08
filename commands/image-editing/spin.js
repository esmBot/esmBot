const ImageCommand = require("../../classes/imageCommand.js");

class SpinCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Spins an image";
  static aliases = ["rotate"];

  static noImage = "you need to provide an image to spin!";
  static command = "spin";
}

module.exports = SpinCommand;