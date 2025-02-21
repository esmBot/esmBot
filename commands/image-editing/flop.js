import ImageCommand from "#cmd-classes/imageCommand.js";

class FlopCommand extends ImageCommand {
  params = {
    flop: true,
  };

  static description = "Flips an image";
  static aliases = ["flip2"];

  static noImage = "You need to provide an image/GIF to flop!";
  static command = "flip";
}

export default FlopCommand;
