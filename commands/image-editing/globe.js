const ImageCommand = require("../../classes/imageCommand");

class GlobeCommand extends ImageCommand {
  static description = "Spins an image";
  static aliases = ["sphere"];

  static noImage = "you need to provide an image to spin!";
  static command = "globe";
}

module.exports = GlobeCommand;