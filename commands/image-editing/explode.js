import ImageCommand from "../../classes/imageCommand.js";

class ExplodeCommand extends ImageCommand {
  params = {
    mapName: "linearexplode.png"
  };

  static description = "Explodes an image";
  static aliases = ["exp"];

  static noImage = "You need to provide an image/GIF to explode!";
  static command = "distort";
}

export default ExplodeCommand;
