import ImageCommand from "#cmd-classes/imageCommand.js";

class DeepfryCommand extends ImageCommand {
  static description = "Deep-fries an image";
  static aliases = ["fry", "jpeg2", "nuke", "df"];

  static noImage = "You need to provide an image/GIF to fry!";
  static command = "deepfry";
}

export default DeepfryCommand;
