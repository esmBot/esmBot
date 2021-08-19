import ImageCommand from "../../classes/imageCommand.js";

class CropCommand extends ImageCommand {
  static description = "Crops an image to 1:1";

  static noImage = "You need to provide an image to crop!";
  static command = "crop";
}

export default CropCommand;