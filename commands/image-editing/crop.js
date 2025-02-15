import ImageCommand from "#cmd-classes/imageCommand.js";

class CropCommand extends ImageCommand {
  static description = "Crops an image to 1:1";

  static noImage = "You need to provide an image/GIF to crop!";
  static command = "crop";
}

export default CropCommand;
