import ImageCommand from "../../classes/imageCommand.js";

class GlobeCommand extends ImageCommand {
  static description = "Spins an image";
  static aliases = ["sphere"];

  static noImage = "You need to provide an image/GIF to spin!";
  static command = "globe";
}

export default GlobeCommand;
