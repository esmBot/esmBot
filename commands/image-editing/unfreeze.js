import MediaCommand from "#cmd-classes/mediaCommand.js";

class UnfreezeCommand extends MediaCommand {
  params = {
    loop: true,
  };

  static description = "Unfreezes an image sequence";

  static requiresAnim = true;
  static alwaysGIF = true;
  static noImage = "You need to provide an image/GIF to unfreeze!";
  static command = "freeze";
}

export default UnfreezeCommand;
