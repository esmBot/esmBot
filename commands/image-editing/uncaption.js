import ImageCommand from "../../classes/imageCommand.js";

class UncaptionCommand extends ImageCommand {
  static description = "Removes the caption from an image";

  static noImage = "You need to provide an image/GIF to uncaption!";
  static command = "uncaption";
}

export default UncaptionCommand;
