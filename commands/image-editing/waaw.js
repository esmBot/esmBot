import MediaCommand from "#cmd-classes/mediaCommand.js";

class WaaWCommand extends MediaCommand {
  static description = "Mirrors the right side of an image onto the left";
  static aliases = ["magik3", "mirror"];

  static noImage = "You need to provide an image/GIF to mirror!";
  static command = "mirror";
}

export default WaaWCommand;
