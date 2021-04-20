const ImageCommand = require("../../classes/imageCommand");

class BlurCommand extends ImageCommand {
  params = {
    sharp: false
  };

  static description = "Blurs an image";

  static noImage = "you need to provide an image to blur!";
  static command = "blur";
}

module.exports = BlurCommand;