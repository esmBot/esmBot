import ImageCommand from "../../classes/imageCommand.js";

class ExplodeCommand extends ImageCommand {
  params = {
    amount: -1
  };

  static description = "Explodes an image";
  static aliases = ["exp"];

  static noImage = "You need to provide an image/GIF to explode!";
  static command = "explode";
}

export default ExplodeCommand;
