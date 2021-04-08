const ImageCommand = require("../../classes/imageCommand.js");

class BlurCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  params = {
    sharp: false
  };

  static description = "Blurs an image";

  static noImage = "you need to provide an image to blur!";
  static command = "blur";
}

module.exports = BlurCommand;