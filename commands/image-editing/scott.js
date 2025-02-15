import ImageCommand from "#cmd-classes/imageCommand.js";

class ScottCommand extends ImageCommand {
  static description = "Makes Scott the Woz show off an image";
  static aliases = ["woz", "tv", "porn"];

  static noImage = "You need to provide an image/GIF for Scott to show off!";
  static command = "scott";
}

export default ScottCommand;
