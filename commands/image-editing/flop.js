import MediaCommand from "#cmd-classes/mediaCommand.js";

class FlopCommand extends MediaCommand {
  params = {
    flop: true,
  };

  static description = "Flips an image";
  static aliases = ["flip2"];

  static noImage = "You need to provide an image/GIF to flop!";
  static command = "flip";
}

export default FlopCommand;
