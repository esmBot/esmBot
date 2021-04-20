const ImageCommand = require("../../classes/imageCommand");

class ExplodeCommand extends ImageCommand {
  params = {
    amount: -1
  };

  static description = "Explodes an image";
  static aliases = ["exp"];

  static noImage = "you need to provide an image to explode!";
  static command = "explode";
}

module.exports = ExplodeCommand;