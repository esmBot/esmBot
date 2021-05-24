const ImageCommand = require("../../classes/imageCommand.js");

class UnfreezeCommand extends ImageCommand {
  params = {
    loop: true
  };

  static description = "Unfreezes an image sequence";

  static requiresGIF = true;
  static noImage = "You need to provide an image to unfreeze!";
  static command = "freeze";
}

module.exports = UnfreezeCommand;