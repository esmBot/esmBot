const ImageCommand = require("../../classes/imageCommand");

class UnfreezeCommand extends ImageCommand {
  params = {
    loop: true
  };

  static description = "Unfreezes an image sequence";

  static requiresGIF = true;
  static noImage = "you need to provide an image to unfreeze!";
  static command = "freeze";
}

module.exports = UnfreezeCommand;