import ImageCommand from "#cmd-classes/imageCommand.js";

class StretchCommand extends ImageCommand {
  params = {
    stretch: true,
  };

  static description = "Stretches an image to a 1:1 aspect ratio";
  static aliases = ["aspect", "ratio", "aspect11", "11"];

  static noImage = "You need to provide an image/GIF to stretch!";
  static command = "resize";
}

export default StretchCommand;
