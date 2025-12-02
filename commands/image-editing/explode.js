import MediaCommand from "#cmd-classes/mediaCommand.js";

class ExplodeCommand extends MediaCommand {
  params = {
    mapName: "linearexplode.png",
  };

  static description = "Explodes an image";
  static aliases = ["exp"];

  static noImage = "You need to provide an image/GIF to explode!";
  static command = "distort";
}

export default ExplodeCommand;
