const ImageCommand = require("../../classes/imageCommand");

class InvertCommand extends ImageCommand {
  static description = "Inverts an image";
  static aliases = ["inverse", "negate", "negative"];

  static noImage = "you need to provide an image to invert!";
  static command = "invert";
}

module.exports = InvertCommand;