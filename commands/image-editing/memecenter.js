import ImageCommand from "#cmd-classes/imageCommand.js";

class MemeCenterCommand extends ImageCommand {
  params = {
    water: "assets/images/memecenter.png",
    gravity: 9,
    mc: true
  };

  static description = "Adds the MemeCenter watermark to an image";
  static aliases = ["memec", "mcenter"];

  static noImage = "You need to provide an image/GIF to add a MemeCenter watermark!";
  static command = "watermark";
}

export default MemeCenterCommand;
