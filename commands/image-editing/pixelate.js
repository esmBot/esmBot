const ImageCommand = require("../../classes/imageCommand.js");

class PixelateCommand extends ImageCommand {
  static description = "Pixelates an image";
  static aliases = ["pixel", "small"];

  static noImage = "you need to provide an image to pixelate!";
  static command = "resize";
}

module.exports = PixelateCommand;