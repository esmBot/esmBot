import MediaCommand from "#cmd-classes/mediaCommand.js";

class ImplodeCommand extends MediaCommand {
  params = {
    mapName: "linearimplode.png",
  };

  static description = "Implodes an image";
  static aliases = ["imp"];

  static noImage = "You need to provide an image/GIF to implode!";
  static command = "distort";
}

export default ImplodeCommand;
