import ImageCommand from "../../classes/imageCommand.js";

class LeakCommand extends ImageCommand {
  static description = "Creates a fake Smash leak thumbnail";
  static aliases = ["smash", "laxchris", "ssbu", "smashleak"];

  static noImage = "You need to provide an image to make a Smash leak thumbnail!";
  static command = "leak";
}

export default LeakCommand;