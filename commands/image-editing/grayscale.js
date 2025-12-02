import MediaCommand from "#cmd-classes/mediaCommand.js";

class GrayscaleCommand extends MediaCommand {
  params = {
    color: "grayscale",
  };

  static description = "Adds a grayscale filter";

  static noImage = "You need to provide an image/GIF to turn grayscale!";
  static command = "colors";
  static aliases = ["gray", "greyscale", "grey"];
}

export default GrayscaleCommand;
