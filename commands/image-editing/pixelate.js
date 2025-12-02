import MediaCommand from "#cmd-classes/mediaCommand.js";

class PixelateCommand extends MediaCommand {
  static description = "Pixelates an image";
  static aliases = ["pixel", "small"];

  static noImage = "You need to provide an image/GIF to pixelate!";
  static command = "resize";
}

export default PixelateCommand;
