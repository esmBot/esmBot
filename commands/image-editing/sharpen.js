const ImageCommand = require("../../classes/imageCommand.js");

class SharpenCommand extends ImageCommand {
  params = {
    sharp: true
  };

  static description = "Sharpens an image";
  static aliases = ["sharp"];

  static noImage = "You need to provide an image to sharpen!";
  static command = "blur";
}

module.exports = SharpenCommand;