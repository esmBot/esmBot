const ImageCommand = require("../../classes/imageCommand.js");

class PixelateCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Pixelates an image";
  static aliases = ["pixel", "small"];

  static noImage = "you need to provide an image to pixelate!";
  static command = "resize";
}

module.exports = PixelateCommand;