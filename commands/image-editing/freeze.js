const ImageCommand = require("../../classes/imageCommand.js");

class FreezeCommand extends ImageCommand {
  params = {
    loop: false
  };

  static description = "Makes an image sequence only play once";
  static aliases = ["noloop", "once"];

  static requiresGIF = true;
  static noImage = "you need to provide an image to freeze!";
  static command = "freeze";
}

module.exports = FreezeCommand;