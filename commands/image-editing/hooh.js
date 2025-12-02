import MediaCommand from "#cmd-classes/mediaCommand.js";

class HooHCommand extends MediaCommand {
  params = {
    vertical: true,
  };

  static description = "Mirrors the bottom of an image onto the top";
  static aliases = ["magik6", "mirror4"];

  static noImage = "You need to provide an image/GIF to mirror!";
  static command = "mirror";
}

export default HooHCommand;
