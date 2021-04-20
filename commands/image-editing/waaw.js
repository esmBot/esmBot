const ImageCommand = require("../../classes/imageCommand");

class WaaWCommand extends ImageCommand {
  static description = "Mirrors the right side of an image onto the left";
  static aliases = ["magik3", "mirror"];

  static noImage = "you need to provide an image to mirror!";
  static command = "mirror";
}

module.exports = WaaWCommand;