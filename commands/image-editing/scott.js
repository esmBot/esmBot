import MediaCommand from "#cmd-classes/mediaCommand.js";

class ScottCommand extends MediaCommand {
  static description = "Makes Scott the Woz show off an image";
  static aliases = ["woz", "tv", "porn"];

  static noImage = "You need to provide an image/GIF for Scott to show off!";
  static command = "scott";
}

export default ScottCommand;
