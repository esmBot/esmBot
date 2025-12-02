import MediaCommand from "#cmd-classes/mediaCommand.js";

class SwirlCommand extends MediaCommand {
  static description = "Swirls an image";
  static aliases = ["whirlpool", "distort"];

  static noImage = "You need to provide an image/GIF to swirl!";
  static command = "swirl";
}

export default SwirlCommand;
