const ImageCommand = require("../../classes/imageCommand");

class HaaHCommand extends ImageCommand {
  params = {
    first: true
  };

  static description = "Mirrors the left side of an image onto the right";
  static aliases = ["magik4", "mirror2"];

  static noImage = "you need to provide an image to mirror!";
  static command = "mirror";
}

module.exports = HaaHCommand;