const ImageCommand = require("../../classes/imageCommand.js");

class FlipCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Flips an image";

  static noImage = "you need to provide an image to flip!";
  static command = "flip";
}

module.exports = FlipCommand;