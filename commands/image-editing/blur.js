import ImageCommand from "../../classes/imageCommand.js";

class BlurCommand extends ImageCommand {
  params = {
    sharp: false
  };

  static description = "Blurs an image";

  static noImage = "You need to provide an image to blur!";
  static command = "blur";
}

export default BlurCommand;