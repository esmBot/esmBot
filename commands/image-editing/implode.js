const ImageCommand = require("../../classes/imageCommand.js");

class ImplodeCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  params = {
    amount: 1
  };

  static description = "Implodes an image";
  static aliases = ["imp"];

  static noImage = "you need to provide an image to implode!";
  static command = "explode";
}

module.exports = ImplodeCommand;