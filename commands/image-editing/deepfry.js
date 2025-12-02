import MediaCommand from "#cmd-classes/mediaCommand.js";

class DeepfryCommand extends MediaCommand {
  static description = "Deep-fries an image";
  static aliases = ["fry", "jpeg2", "nuke", "df"];

  static noImage = "You need to provide an image/GIF to fry!";
  static command = "deepfry";
}

export default DeepfryCommand;
