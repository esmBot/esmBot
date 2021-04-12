const ImageCommand = require("../../classes/imageCommand.js");

class BlurpleCommand extends ImageCommand {
  static description = "Turns an image blurple";

  static noImage = "you need to provide an image to make blurple!";
  static command = "blurple";
  static aliases = ["blurp"];
}

module.exports = BlurpleCommand;