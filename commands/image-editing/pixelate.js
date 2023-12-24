import ImageCommand from "#cmd-classes/imageCommand.js";

class PixelateCommand extends ImageCommand {
  static description = "Pixelates an image";
  static aliases = ["pixel", "small"];

  static noImage = "You need to provide an image/GIF to pixelate!";
  static command = "resize";
}

export default PixelateCommand;
