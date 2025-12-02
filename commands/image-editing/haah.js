import MediaCommand from "#cmd-classes/mediaCommand.js";

class HaaHCommand extends MediaCommand {
  params = {
    first: true,
  };

  static description = "Mirrors the left side of an image onto the right";
  static aliases = ["magik4", "mirror2"];

  static noImage = "You need to provide an image/GIF to mirror!";
  static command = "mirror";
}

export default HaaHCommand;
