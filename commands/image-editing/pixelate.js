const ImageCommand = require("../../classes/imageCommand");

class PixelateCommand extends ImageCommand {
  static description = "Pixelates an image";
  static aliases = ["pixel", "small"];

  static noImage = "you need to provide an image to pixelate!";
  static command = "resize";
}

module.exports = PixelateCommand;