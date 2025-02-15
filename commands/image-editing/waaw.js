import ImageCommand from "#cmd-classes/imageCommand.js";

class WaaWCommand extends ImageCommand {
  static description = "Mirrors the right side of an image onto the left";
  static aliases = ["magik3", "mirror"];

  static noImage = "You need to provide an image/GIF to mirror!";
  static command = "mirror";
}

export default WaaWCommand;
