import MediaCommand from "#cmd-classes/mediaCommand.js";

class CropCommand extends MediaCommand {
  static description = "Crops an image to 1:1";

  static noImage = "You need to provide an image/GIF to crop!";
  static command = "crop";
}

export default CropCommand;
