import ImageCommand from "#cmd-classes/imageCommand.js";

class WideCommand extends ImageCommand {
  params = {
    wide: true
  };

  static description = "Stretches an image to 19x its width";
  static aliases = ["w19", "wide19"];

  static noImage = "You need to provide an image/GIF to stretch!";
  static command = "resize";
}

export default WideCommand;
