const ImageCommand = require("../../classes/imageCommand.js");

class UncaptionCommand extends ImageCommand {
  static description = "Removes the caption from an image";

  static noImage = "You need to provide an image to uncaption!";
  static command = "uncaption";
}

module.exports = UncaptionCommand;