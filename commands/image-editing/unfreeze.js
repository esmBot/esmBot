import ImageCommand from "../../classes/imageCommand.js";

class UnfreezeCommand extends ImageCommand {
  params = {
    loop: true
  };

  static description = "Unfreezes an image sequence";

  static requiresGIF = true;
  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to unfreeze!";
  static command = "freeze";
}

export default UnfreezeCommand;
