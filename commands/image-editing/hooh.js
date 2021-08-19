import ImageCommand from "../../classes/imageCommand.js";

class HooHCommand extends ImageCommand {
  params = {
    vertical: true
  };

  static description = "Mirrors the bottom of an image onto the top";
  static aliases = ["magik6", "mirror4"];

  static noImage = "You need to provide an image to mirror!";
  static command = "mirror";
}

export default HooHCommand;