const ImageCommand = require("../../classes/imageCommand");

class TrumpCommand extends ImageCommand {
  static description = "Makes Trump display an image";

  static noImage = "you need to provide an image for Trump to display!";
  static command = "trump";
}

module.exports = TrumpCommand;