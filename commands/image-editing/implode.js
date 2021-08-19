import ImageCommand from "../../classes/imageCommand.js";

class ImplodeCommand extends ImageCommand {
  params = {
    amount: 1
  };

  static description = "Implodes an image";
  static aliases = ["imp"];

  static noImage = "You need to provide an image to implode!";
  static command = "explode";
}

export default ImplodeCommand;