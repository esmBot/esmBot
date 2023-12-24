import ImageCommand from "#cmd-classes/imageCommand.js";

class SwirlCommand extends ImageCommand {
  static description = "Swirls an image";
  static aliases = ["whirlpool", "distort"];

  static noImage = "You need to provide an image/GIF to swirl!";
  static command = "swirl";
}

export default SwirlCommand;
