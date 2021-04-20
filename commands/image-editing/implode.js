const ImageCommand = require("../../classes/imageCommand");

class ImplodeCommand extends ImageCommand {
  params = {
    amount: 1
  };

  static description = "Implodes an image";
  static aliases = ["imp"];

  static noImage = "you need to provide an image to implode!";
  static command = "explode";
}

module.exports = ImplodeCommand;