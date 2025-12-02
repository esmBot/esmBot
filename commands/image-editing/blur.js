import MediaCommand from "#cmd-classes/mediaCommand.js";

class BlurCommand extends MediaCommand {
  params = {
    sharp: false,
  };

  static description = "Blurs an image";

  static noImage = "You need to provide an image/GIF to blur!";
  static command = "blur";
}

export default BlurCommand;
