const ImageCommand = require("../../classes/imageCommand.js");

class TrumpCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Makes Trump display an image";

  static noImage = "you need to provide an image for Trump to display!";
  static command = "trump";
}

module.exports = TrumpCommand;