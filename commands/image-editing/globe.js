import MediaCommand from "#cmd-classes/mediaCommand.js";

class GlobeCommand extends MediaCommand {
  static description = "Spins an image";
  static aliases = ["sphere"];

  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to spin!";
  static command = "globe";
}

export default GlobeCommand;
