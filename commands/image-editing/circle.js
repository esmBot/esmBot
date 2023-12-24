import ImageCommand from "#cmd-classes/imageCommand.js";

class CircleCommand extends ImageCommand {
  static description = "Applies a radial blur effect on an image";
  static aliases = ["cblur", "radial", "radialblur"];

  static noImage = "You need to provide an image/GIF to add radial blur!";
  static command = "circle";
}

export default CircleCommand;
