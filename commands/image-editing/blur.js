import ImageCommand from "#cmd-classes/imageCommand.js";

class BlurCommand extends ImageCommand {
  params = {
    sharp: false,
  };

  static description = "Blurs an image";

  static noImage = "You need to provide an image/GIF to blur!";
  static command = "blur";
}

export default BlurCommand;
