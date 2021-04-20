const ImageCommand = require("../../classes/imageCommand");

class SwirlCommand extends ImageCommand {
  static description = "Swirls an image";
  static aliases = ["whirlpool"];

  static noImage = "you need to provide an image to swirl!";
  static command = "swirl";
}

module.exports = SwirlCommand;