import ImageCommand from "../../classes/imageCommand.js";

class VignetteCommand extends ImageCommand {
  params = {
    water: "assets/images/vignette.png",
    yscale: 1.0,
    gravity: 1,
    resize: true
  };

  static description = "Adds a vignette to an image";

  static noImage = "You need to provide an image/GIF to add a vignette!";
  static command = "watermark";
}

export default VignetteCommand;
