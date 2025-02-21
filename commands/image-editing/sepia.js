import ImageCommand from "#cmd-classes/imageCommand.js";

class SepiaCommand extends ImageCommand {
  params = {
    color: "sepia",
  };

  static description = "Adds a sepia filter";

  static noImage = "You need to provide an image/GIF to add a sepia filter!";
  static command = "colors";
}

export default SepiaCommand;
