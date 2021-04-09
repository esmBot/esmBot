const ImageCommand = require("../../classes/imageCommand.js");

class LeakCommand extends ImageCommand {
  static description = "Creates a fake Smash leak thumbnail";
  static aliases = ["smash", "laxchris", "ssbu", "smashleak"];

  static noImage = "you need to provide an image to make a Smash leak thumbnail!";
  static command = "leak";
}

module.exports = LeakCommand;