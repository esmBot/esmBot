const ImageCommand = require("../../classes/imageCommand.js");

class MagikCommand extends ImageCommand {
  static description = "Adds a content aware scale effect to an image";
  static aliases = ["imagemagic", "imagemagick", "imagemagik", "magic", "magick", "cas", "liquid"];

  static noImage = "you need to provide an image to add some magik!";
  static command = "magik";
}

module.exports = MagikCommand;