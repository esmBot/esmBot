const ImageCommand = require("../../classes/imageCommand");

class MemeCenterCommand extends ImageCommand {
  params = {
    water: "./assets/images/memecenter.png",
    gravity: 9,
    mc: true
  };

  static description = "Adds the MemeCenter watermark to an image";
  static aliases = ["memec", "mcenter"];

  static noImage = "you need to provide an image to add a MemeCenter watermark!";
  static command = "watermark";
}

module.exports = MemeCenterCommand;