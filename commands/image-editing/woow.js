import ImageCommand from "#cmd-classes/imageCommand.js";

class WooWCommand extends ImageCommand {
  params = {
    vertical: true,
    first: true,
  };

  static description = "Mirrors the top of an image onto the bottom";
  static aliases = ["magik5", "mirror3"];

  static noImage = "You need to provide an image/GIF to mirror!";
  static command = "mirror";
}

export default WooWCommand;
