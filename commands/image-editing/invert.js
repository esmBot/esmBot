const ImageCommand = require("../../classes/imageCommand.js");

class InvertCommand extends ImageCommand {
  static description = "Inverts an image";
  static aliases = ["inverse", "negate", "negative"];

  static noImage = "You need to provide an image to invert!";
  static command = "invert";
}

module.exports = InvertCommand;