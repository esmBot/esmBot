import ImageCommand from "#cmd-classes/imageCommand.js";

class SharpenCommand extends ImageCommand {
  params = {
    sharp: true,
  };

  static description = "Sharpens an image";
  static aliases = ["sharp"];

  static noImage = "You need to provide an image/GIF to sharpen!";
  static command = "blur";
}

export default SharpenCommand;
