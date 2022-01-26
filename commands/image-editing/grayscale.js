import ImageCommand from "../../classes/imageCommand.js";

class GrayscaleCommand extends ImageCommand {
  params() {
    return {
      color: "grayscale"
    };
  }

  static description = "Adds a grayscale filter";

  static noImage = "You need to provide an image/GIF to turn grayscale!";
  static command = "colors";
  static aliases = ["gray", "greyscale", "grey"];
}

export default GrayscaleCommand;
