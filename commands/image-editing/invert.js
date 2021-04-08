const ImageCommand = require("../../classes/imageCommand.js");

class InvertCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Inverts an image";
  static aliases = ["inverse", "negate", "negative"];

  static noImage = "you need to provide an image to invert!";
  static command = "invert";
}

module.exports = InvertCommand;