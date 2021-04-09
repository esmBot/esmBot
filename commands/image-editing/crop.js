const ImageCommand = require("../../classes/imageCommand.js");

class CropCommand extends ImageCommand {
  static description = "Crops an image to 1:1";

  static noImage = "you need to provide an image to crop!";
  static command = "crop";
}

module.exports = CropCommand;