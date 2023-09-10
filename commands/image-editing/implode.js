import ImageCommand from "../../classes/imageCommand.js";

class ImplodeCommand extends ImageCommand {
  params = {
    mapName: "linearimplode.png"
  };

  static description = "Implodes an image";
  static aliases = ["imp"];

  static noImage = "You need to provide an image/GIF to implode!";
  static command = "distort";
}

export default ImplodeCommand;
