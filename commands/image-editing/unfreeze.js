const ImageCommand = require("../../classes/imageCommand.js");

class UnfreezeCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  params = {
    loop: true
  };

  static description = "Unfreezes an image sequence";

  static requiresGIF = true;
  static noImage = "you need to provide an image to unfreeze!";
  static command = "freeze";
}

module.exports = UnfreezeCommand;