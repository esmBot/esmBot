const ImageCommand = require("../../classes/imageCommand.js");

class GlobeCommand extends ImageCommand {
  constructor(message, args, content) {
    super(message, args, content);
  }

  static description = "Spins an image";
  static aliases = ["sphere"];

  static noImage = "you need to provide an image to spin!";
  static command = "globe";
}

module.exports = GlobeCommand;