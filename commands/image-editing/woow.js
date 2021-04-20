const ImageCommand = require("../../classes/imageCommand");

class WooWCommand extends ImageCommand {
  params = {
    vertical: true,
    first: true
  };

  static description = "Mirrors the top of an image onto the bottom";
  static aliases = ["magik5", "mirror3"];

  static noImage = "you need to provide an image to mirror!";
  static command = "mirror";
}

module.exports = WooWCommand;